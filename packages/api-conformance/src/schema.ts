import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

/**
 * The pinned OpenAPI document, read as a route table.
 *
 * `packages/client/schema.json` is the artifact the generated client was built
 * from, so it is the definition of what this repository BELIEVES the API to
 * be. Everything downstream — which operations exist, which responses are
 * declared, which shape a body should have — is derived from it rather than
 * written out by hand, because a hand-written copy is a second source of truth
 * that drifts silently.
 *
 * A live run additionally fetches the SERVED document and compares, so the
 * question "does the pin still match the running server?" is answered by
 * measurement on every run rather than by assumption. See `compareCatalogues`.
 */

/**
 * Read from the sibling package's file rather than through its package name.
 *
 * `packages/client` publishes only `dist`, and its export map has no
 * `./schema.json` entry, so importing it by specifier fails. The file is the
 * pinned artifact regardless of whether the package chooses to export it, and
 * the two packages sit in one repository, so the path is stable.
 *
 * Located by walking up to the workspace root rather than from this module's
 * own URL: the test transform emits CommonJS, where `import.meta` is a syntax
 * error, and a path relative to the working directory would depend on where
 * the command was invoked from.
 */
export function workspaceRoot(from: string = process.cwd()): string {
  let directory = from;
  for (;;) {
    if (existsSync(join(directory, "pnpm-workspace.yaml"))) {
      return directory;
    }
    const parent = dirname(directory);
    if (parent === directory || parent === parse(directory).root) {
      throw new Error(
        `no pnpm-workspace.yaml above ${from}; the pinned schema cannot be located`,
      );
    }
    directory = parent;
  }
}

export function pinnedSchemaPath(): string {
  return join(workspaceRoot(), "packages", "client", "schema.json");
}

interface OpenApiOperation {
  operationId?: string;
  responses?: Record<string, { content?: Record<string, unknown> }>;
  summary?: string;
}

interface OpenApiDocument {
  components?: { schemas?: Record<string, unknown> };
  openapi?: string;
  paths?: Record<string, Record<string, OpenApiOperation>>;
}

export const HTTP_METHODS = ["delete", "get", "patch", "post", "put"] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface Operation {
  /** Response codes the document declares, ascending. */
  declaredResponses: string[];
  method: HttpMethod;
  /** Whether the operation names itself; the generator relies on this. */
  operationId: string;
  /** Templated path exactly as written, e.g. `/api/ai-agents/{address}`. */
  path: string;
  /** Response codes declared WITH a non-empty content schema. */
  responsesWithContent: string[];
  /** Response codes declaring `content` whose schema is the empty object. */
  responsesWithEmptySchema: string[];
}

export interface Catalogue {
  document: OpenApiDocument;
  operations: Operation[];
  /** Component schema names, for the conformance validator to reference. */
  schemaNames: string[];
}

/** The document this repository pins. */
export function loadPinnedDocument(): OpenApiDocument {
  return JSON.parse(
    readFileSync(pinnedSchemaPath(), "utf8"),
  ) as OpenApiDocument;
}

/**
 * Whether a declared response actually describes a body.
 *
 * Three states matter and only two are usually noticed. A response may declare
 * no `content` at all (honest: there is no body), or declare content whose
 * schema is the empty object (worse than absent — tooling reports the response
 * as described while generating no type, which is how a caller ends up with
 * `unknown`), or declare a real schema.
 */
export type BodyDescription = "absent" | "described" | "empty-schema";

export function describeResponseBody(response: {
  content?: Record<string, unknown>;
}): BodyDescription {
  const content = response.content;
  if (content === undefined) {
    return "absent";
  }
  const described = Object.values(content).some((media) => {
    const schema = (media as { schema?: unknown } | undefined)?.schema;
    if (schema === undefined || schema === null) {
      return false;
    }
    return Object.keys(schema as Record<string, unknown>).length > 0;
  });
  return described ? "described" : "empty-schema";
}

/** Convenience for the common question: is there a schema to validate against? */
export function describesABody(response: {
  content?: Record<string, unknown>;
}): boolean {
  return describeResponseBody(response) === "described";
}

/** Reads a document into the route table the rest of the harness works from. */
export function readCatalogue(document: OpenApiDocument): Catalogue {
  const operations: Operation[] = [];

  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      // Presence asked of the object rather than of the indexed value:
      // indexing a record is typed as always finding something, which is
      // untrue of a document read from disk.
      if (!Object.hasOwn(item, method)) {
        continue;
      }
      const operation = item[method];
      const responses = operation.responses ?? {};
      operations.push({
        declaredResponses: Object.keys(responses).sort(),
        method,
        operationId: operation.operationId ?? `${method} ${path}`,
        path,
        responsesWithContent: Object.entries(responses)
          .filter(([, response]) => describesABody(response))
          .map(([code]) => code)
          .sort(),
        responsesWithEmptySchema: Object.entries(responses)
          .filter(
            ([, response]) => describeResponseBody(response) === "empty-schema",
          )
          .map(([code]) => code)
          .sort(),
      });
    }
  }

  operations.sort((left, right) =>
    left.operationId.localeCompare(right.operationId),
  );

  return {
    document,
    operations,
    schemaNames: Object.keys(document.components?.schemas ?? {}).sort(),
  };
}

/** Resolves a request path against the table, returning the operation. */
export function matchOperation(
  catalogue: Catalogue,
  method: string,
  path: string,
): Operation | undefined {
  const wanted = method.toLowerCase();
  return catalogue.operations.find((operation) => {
    if (operation.method !== wanted) {
      return false;
    }
    // `{name}` matches one path segment, which is the only templating this
    // document uses.
    const pattern = new RegExp(
      `^${operation.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{[^/]+?\\\}/g, "[^/]+")}$`,
    );
    return pattern.test(path);
  });
}

export interface CatalogueDifference {
  /** Operations whose declared response codes differ, with both sides. */
  changed: { operationId: string; pinned: string[]; served: string[] }[];
  /** Operation ids present in the pin but not the served document. */
  onlyPinned: string[];
  /** Operation ids present in the served document but not the pin. */
  onlyServed: string[];
}

/**
 * Compares the pinned document with one fetched from a running server.
 *
 * Compares PARSED documents rather than bytes: serialization and key ordering
 * differ between the generator and the pin for reasons that are not drift, and
 * a byte comparison reports those as differences. This has already caused one
 * false alarm — a report that the pin was stale, disproved by finding the two
 * documents recursively equal with only their sha256 differing.
 */
export function compareCatalogues(
  pinned: Catalogue,
  served: Catalogue,
): CatalogueDifference {
  const pinnedById = new Map(
    pinned.operations.map((operation) => [operation.operationId, operation]),
  );
  const servedById = new Map(
    served.operations.map((operation) => [operation.operationId, operation]),
  );

  const changed: CatalogueDifference["changed"] = [];
  for (const [id, pinnedOperation] of pinnedById) {
    const servedOperation = servedById.get(id);
    if (servedOperation === undefined) {
      continue;
    }
    const left = pinnedOperation.declaredResponses.join(",");
    const right = servedOperation.declaredResponses.join(",");
    if (left !== right) {
      changed.push({
        operationId: id,
        pinned: pinnedOperation.declaredResponses,
        served: servedOperation.declaredResponses,
      });
    }
  }

  return {
    changed,
    onlyPinned: [...pinnedById.keys()]
      .filter((id) => !servedById.has(id))
      .sort(),
    onlyServed: [...servedById.keys()]
      .filter((id) => !pinnedById.has(id))
      .sort(),
  };
}
