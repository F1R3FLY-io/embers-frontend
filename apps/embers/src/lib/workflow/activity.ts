import type { ActivityReference } from "./types";

const BUILTINS: ReadonlySet<
  Extract<ActivityReference, { kind: "builtin" }>["name"]
> = new Set(["compress", "text-model", "tti-model", "tts-model"]);

function object(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, context: string): string {
  if (typeof value !== "string") {
    throw new Error(`${context} must be a string.`);
  }
  return value;
}

function positiveInteger(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${context} must be a positive safe integer.`);
  }
  return value;
}

function protocol(
  value: unknown,
  context: string,
): "simple-v1" | "structured-v1" {
  if (value !== "simple-v1" && value !== "structured-v1") {
    throw new Error(`${context} must be simple-v1 or structured-v1.`);
  }
  return value;
}

export function activityReference(value: unknown): ActivityReference {
  const candidate = object(value, "activity");
  switch (candidate.kind) {
    case "agent":
      return {
        agentId: string(candidate.agentId, "activity.agentId"),
        agentVersion: string(candidate.agentVersion, "activity.agentVersion"),
        kind: "agent",
        protocol: protocol(candidate.protocol, "activity.protocol"),
      };
    case "builtin": {
      const name = string(candidate.name, "activity.name");
      if (
        !BUILTINS.has(
          name as Extract<ActivityReference, { kind: "builtin" }>["name"],
        )
      ) {
        throw new Error(`activity.name ${name} is not a Workflow v2 builtin.`);
      }
      return {
        kind: "builtin",
        name: name as Extract<ActivityReference, { kind: "builtin" }>["name"],
      };
    }
    case "rholang":
      return {
        kind: "rholang",
        protocol: protocol(candidate.protocol, "activity.protocol"),
        uri: string(candidate.uri, "activity.uri"),
      };
    case "workflow":
      return {
        kind: "workflow",
        teamId: string(candidate.teamId, "activity.teamId"),
        version: string(candidate.version, "activity.version"),
      };
    case "foreign-term": {
      const abi = object(candidate.abi, "activity.abi");
      const resources = object(candidate.resources, "activity.resources");
      if (abi.version !== "flt-v1") {
        throw new Error("activity.abi.version must be flt-v1.");
      }
      if (
        !Array.isArray(candidate.authorities) ||
        !candidate.authorities.every(
          (authority) => typeof authority === "string",
        )
      ) {
        throw new Error("activity.authorities must be an array of strings.");
      }
      return {
        abi: {
          entrypoint: string(abi.entrypoint, "activity.abi.entrypoint"),
          inputBinding: string(abi.inputBinding, "activity.abi.inputBinding"),
          outputBinding: string(
            abi.outputBinding,
            "activity.abi.outputBinding",
          ),
          version: "flt-v1",
        },
        artifactHash: string(candidate.artifactHash, "activity.artifactHash"),
        authorities: candidate.authorities,
        kind: "foreign-term",
        languageSpecificationHash: string(
          candidate.languageSpecificationHash,
          "activity.languageSpecificationHash",
        ),
        languageTag: string(candidate.languageTag, "activity.languageTag"),
        resources: {
          fuel: positiveInteger(resources.fuel, "activity.resources.fuel"),
          maxOutputBytes: positiveInteger(
            resources.maxOutputBytes,
            "activity.resources.maxOutputBytes",
          ),
          maxPhlo: positiveInteger(
            resources.maxPhlo,
            "activity.resources.maxPhlo",
          ),
        },
        source: string(candidate.source, "activity.source"),
      };
    }
    default:
      throw new Error("activity.kind is not a Workflow v2 activity kind.");
  }
}

export function activityReferenceFromJson(source: string): ActivityReference {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error(
      `Activity is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return activityReference(value);
}
