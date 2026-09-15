import type { ErrorObject, ValidateFunction } from "ajv";

import Ajv from "ajv";
import addFormats from "ajv-formats";

import type { Catalogue } from "./schema";

/**
 * Checks a response body against the schema the document declares for it.
 *
 * Validation happens on the RAW wire body, before the generated client
 * deserializes it. That ordering is the point: the client's mappers coerce and
 * default, so a body that is wrong on the wire can arrive at a caller looking
 * plausible. Anything that reaches the SDK has already been laundered.
 *
 * Ajv consumes the pinned document's `components.schemas` directly rather than
 * a hand-written mirror. Writing zod mirrors of 108 component schemas would
 * create a second source of truth that drifts from the first, and the first is
 * the artifact the client was generated from.
 */

export type Severity = "error" | "info";

export interface ConformanceFinding {
  /** JSON pointer into the body, where Ajv reports one. */
  instancePath: string;
  message: string;
  severity: Severity;
}

export interface Validator {
  /** Component schema names this validator knows. */
  known: string[];
  validate: (schemaName: string, body: unknown) => ConformanceFinding[];
}

/**
 * OpenAPI 3.0 is not quite JSON Schema, and Ajv is strict about the
 * difference. `nullable: true` is the one that matters here -- the document
 * uses it, and Ajv would otherwise reject the schema itself rather than the
 * body. Translating it to a type union is the standard equivalence.
 */
function toJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toJsonSchema);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(source)) {
    if (key === "nullable") {
      continue;
    }
    if (key === "example" || key === "examples") {
      // Examples are documentation, not constraints, and an example that does
      // not satisfy its own schema would otherwise fail compilation.
      continue;
    }
    result[key] = toJsonSchema(inner);
  }

  if (source.nullable === true && typeof source.type === "string") {
    result.type = [source.type, "null"];
  }
  return result;
}

function describe(error: ErrorObject): string {
  const where = error.instancePath === "" ? "the body" : error.instancePath;
  return `${where} ${error.message ?? "failed validation"}`;
}

/**
 * The domain formats this API declares, defined rather than ignored.
 *
 * Ajv warns and skips a format it does not know, which would quietly reduce
 * every one of these fields to "is a string" -- and these are exactly the
 * fields where being a string is not the interesting property. A `uint64` that
 * arrives as `-1`, or an address whose checksum does not verify, is precisely
 * the kind of divergence this campaign exists to catch, and it would pass
 * silently.
 *
 * Each is checked structurally here. The SDK's own entities do the
 * cryptographic verification; duplicating that would test the SDK rather than
 * the server.
 */
const DOMAIN_FORMATS: Record<string, (value: string) => boolean> = {
  // Base58-ish with a checksum the SDK verifies; the shape is what is checked.
  "blockchain-address": (value) => /^[1-9A-HJ-NP-Za-km-z]{40,80}$/.test(value),
  "blockchain-uri": (value) => /^rho:id:[a-z0-9]{40,80}$/.test(value),
  bytes: (value) => {
    // Strict base64: length a multiple of four, padding only at the end.
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
      return false;
    }
    return true;
  },
  // A serialized graph; opaque here, and non-empty is the only real claim.
  graphl: (value) => value.length > 0,
  int64: (value) => {
    if (!/^-?\d+$/.test(value)) {
      return false;
    }
    const parsed = BigInt(value);
    return parsed >= -(2n ** 63n) && parsed < 2n ** 63n;
  },
  "public-key": (value) => /^(0x)?[0-9a-fA-F]{66,130}$/.test(value),
  // Milliseconds since the epoch, as a decimal string. Not negative, and not
  // so large that it is obviously a nanosecond value in the wrong unit.
  "timestamp-millis": (value) =>
    /^\d+$/.test(value) && BigInt(value) < 10n ** 15n,
  uint64: (value) => {
    if (!/^\d+$/.test(value)) {
      return false;
    }
    return BigInt(value) < 2n ** 64n;
  },
};

/** Builds a validator over a catalogue's component schemas. */
export function makeValidator(catalogue: Catalogue): Validator {
  const schemas = catalogue.document.components?.schemas ?? {};

  const ajv = new Ajv({
    allErrors: true,
    // Unknown keywords appear in an OpenAPI document (discriminator, xml) and
    // are not errors in the body; failing on them would reject every schema.
    strict: false,
  });
  addFormats(ajv);
  for (const [name, validate] of Object.entries(DOMAIN_FORMATS)) {
    ajv.addFormat(name, { type: "string", validate });
  }

  for (const [name, schema] of Object.entries(schemas)) {
    ajv.addSchema(
      toJsonSchema(schema) as object,
      `#/components/schemas/${name}`,
    );
  }

  const compiled = new Map<string, ValidateFunction>();

  return {
    known: Object.keys(schemas).sort(),

    validate(schemaName, body) {
      const reference = `#/components/schemas/${schemaName}`;
      let validate = compiled.get(reference);
      if (validate === undefined) {
        const found = ajv.getSchema(reference);
        if (found === undefined) {
          return [
            {
              instancePath: "",
              message: `no component schema named ${schemaName}`,
              severity: "error",
            },
          ];
        }
        validate = found;
        compiled.set(reference, validate);
      }

      if (validate(body)) {
        return [];
      }

      return (validate.errors ?? []).map((error) => ({
        instancePath: error.instancePath,
        message: describe(error),
        // A property the schema does not mention is worth recording but is not
        // a contract violation: a server may add fields, and a client that
        // ignores them keeps working. A MISSING or wrongly-typed one is.
        severity: (error.keyword === "additionalProperties"
          ? "info"
          : "error") satisfies Severity,
      }));
    },
  };
}

/**
 * Operations that declare a response with no usable schema, split by kind.
 *
 * The two are not the same defect and do not have the same fix, which is why
 * they are kept apart.
 *
 * An ABSENT content block is often honest -- a readiness probe really has no
 * body -- so it is reported for review rather than as a fault.
 *
 * An EMPTY schema (`content: {"application/json": {"schema": {}}}`) is worse
 * than an absent one: tooling reports the response as described and then
 * generates no type for it. That is the direct cause of `sendResponse:
 * unknown` in the SDK's run, command, and reveal methods, where the server
 * does return structured state. The fix is a `$ref`, not new modelling: the
 * response types already exist in `components.schemas`.
 */
export interface UndescribedResponse {
  declaredCodes: string[];
  operationId: string;
}

export function emptySchemaResponses(
  catalogue: Catalogue,
): UndescribedResponse[] {
  return catalogue.operations
    .filter((operation) => operation.responsesWithEmptySchema.length > 0)
    .map((operation) => ({
      declaredCodes: operation.responsesWithEmptySchema,
      operationId: operation.operationId,
    }));
}

export function absentContentResponses(
  catalogue: Catalogue,
): UndescribedResponse[] {
  return catalogue.operations
    .filter(
      (operation) =>
        operation.declaredResponses.length > 0 &&
        operation.responsesWithContent.length === 0 &&
        operation.responsesWithEmptySchema.length === 0,
    )
    .map((operation) => ({
      declaredCodes: operation.declaredResponses,
      operationId: operation.operationId,
    }));
}

/** Operations that declare only a success code, so errors cannot be typed. */
export function successOnlyOperations(catalogue: Catalogue): string[] {
  return catalogue.operations
    .filter((operation) =>
      operation.declaredResponses.every((code) => code.startsWith("2")),
    )
    .map((operation) => operation.operationId);
}
