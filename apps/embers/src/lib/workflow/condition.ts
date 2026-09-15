import type { Condition, ValueExpression, ValuePath } from "./types";

const VALUE_ROOTS = new Set<ValuePath["root"]>([
  "error",
  "input",
  "output",
  "state",
]);
type ComparisonOperator = Extract<Condition, { kind: "compare" }>["operator"];

const COMPARISONS: ReadonlySet<ComparisonOperator> = new Set([
  "eq",
  "ge",
  "gt",
  "le",
  "lt",
  "ne",
] as const);

function object(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function valuePath(value: unknown, context: string): ValuePath {
  const candidate = object(value, context);
  if (
    typeof candidate.root !== "string" ||
    !VALUE_ROOTS.has(candidate.root as ValuePath["root"])
  ) {
    throw new Error(`${context}.root must be error, input, output, or state.`);
  }
  if (!Array.isArray(candidate.path)) {
    throw new Error(`${context}.path must contain non-empty string segments.`);
  }
  const path = candidate.path.map((segment: unknown) => {
    if (typeof segment !== "string" || segment.trim() === "") {
      throw new Error(
        `${context}.path must contain non-empty string segments.`,
      );
    }
    return segment;
  });
  return {
    path,
    root: candidate.root as ValuePath["root"],
  };
}

function valueExpression(value: unknown, context: string): ValueExpression {
  const candidate = object(value, context);
  if (candidate.kind === "path") {
    return { kind: "path", ...valuePath(candidate, context) };
  }
  if (
    candidate.kind === "literal" &&
    (candidate.value === null ||
      typeof candidate.value === "boolean" ||
      typeof candidate.value === "number" ||
      typeof candidate.value === "string")
  ) {
    return { kind: "literal", value: candidate.value };
  }
  throw new Error(`${context} must be a path or portable scalar literal.`);
}

function condition(value: unknown, context: string): Condition {
  const candidate = object(value, context);
  switch (candidate.kind) {
    case "literal":
      if (typeof candidate.value !== "boolean") {
        throw new Error(`${context}.value must be Boolean.`);
      }
      return { kind: "literal", value: candidate.value };
    case "all":
    case "any":
      if (
        !Array.isArray(candidate.operands) ||
        candidate.operands.length === 0
      ) {
        throw new Error(`${context}.operands must be a non-empty array.`);
      }
      return {
        kind: candidate.kind,
        operands: candidate.operands.map((operand, index) =>
          condition(operand, `${context}.operands[${index}]`),
        ),
      };
    case "not":
      return {
        kind: "not",
        operand: condition(candidate.operand, `${context}.operand`),
      };
    case "exists":
      return {
        expression: valueExpression(
          candidate.expression,
          `${context}.expression`,
        ),
        kind: "exists",
      };
    case "compare":
      if (
        typeof candidate.operator !== "string" ||
        !COMPARISONS.has(candidate.operator as ComparisonOperator)
      ) {
        throw new Error(`${context}.operator is not a comparison operator.`);
      }
      return {
        kind: "compare",
        left: valueExpression(candidate.left, `${context}.left`),
        operator: candidate.operator as ComparisonOperator,
        right: valueExpression(candidate.right, `${context}.right`),
      };
    case "rholang": {
      if (typeof candidate.source !== "string") {
        throw new Error(`${context}.source must be a string.`);
      }
      const inputs = object(candidate.inputs, `${context}.inputs`);
      return {
        inputs: Object.fromEntries(
          Object.entries(inputs).map(([name, path]) => [
            name,
            valuePath(path, `${context}.inputs.${name}`),
          ]),
        ),
        kind: "rholang",
        source: candidate.source,
        sourceHash:
          candidate.sourceHash === undefined
            ? undefined
            : typeof candidate.sourceHash === "string"
              ? candidate.sourceHash
              : (() => {
                  throw new Error(`${context}.sourceHash must be a string.`);
                })(),
      };
    }
    default:
      throw new Error(`${context}.kind is not a Workflow v2 condition kind.`);
  }
}

export function conditionFromJson(source: string): Condition {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error(
      `Condition is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return condition(value, "condition");
}
