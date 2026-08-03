import type {
  Condition,
  ValueExpression,
  WorkflowEdgeData,
} from "@/lib/workflow";

// A fully default transition (completed trigger, all-matches routing, fail on
// no match, priority 0, no guard, no loop) must annotate as nothing at all:
// only deviations from the default earn ink on the canvas. Everything shown is
// compressed to symbols so an edge reads at a glance instead of as a sentence.

const OPERATOR_GLYPHS = {
  eq: "=",
  ge: "≥",
  gt: ">",
  le: "≤",
  lt: "<",
  ne: "≠",
} as const;

function pathText(root: string, path: string[]): string {
  return [root, ...path].join(".");
}

function expressionText(expression: ValueExpression): string {
  return expression.kind === "path"
    ? pathText(expression.root, expression.path)
    : JSON.stringify(expression.value);
}

function conditionText(condition: Condition, nested: boolean): string {
  switch (condition.kind) {
    case "all":
    case "any": {
      const glue = condition.kind === "all" ? " ∧ " : " ∨ ";
      const joined = condition.operands
        .map((operand) => conditionText(operand, true))
        .join(glue);
      return nested ? `(${joined})` : joined;
    }
    case "compare": {
      const text = `${expressionText(condition.left)} ${OPERATOR_GLYPHS[condition.operator]} ${expressionText(condition.right)}`;
      return nested ? `(${text})` : text;
    }
    case "exists": {
      const text = `∃ ${expressionText(condition.expression)}`;
      return nested ? `(${text})` : text;
    }
    case "literal":
      return condition.value ? "⊤" : "⊥";
    case "not":
      return `¬(${conditionText(condition.operand, false)})`;
    case "rholang":
      return "rho";
  }
}

/**
 * The symbolic canvas annotation for a transition, or null when the edge is
 * fully default and must render no annotation at all. Deviations compose in a
 * fixed order: trigger, guard, loop, first-match priority, no-match policy.
 */
export function edgeAnnotation(
  data: WorkflowEdgeData | undefined,
): string | null {
  if (data === undefined) {
    return null;
  }
  const parts: string[] = [];

  const trigger = data.trigger ?? "completed";
  if (trigger !== "completed") {
    parts.push(
      trigger.startsWith("custom:")
        ? trigger.slice("custom:".length)
        : trigger,
    );
  }

  const guard = data.guard;
  if (guard !== undefined && !(guard.kind === "literal" && guard.value)) {
    parts.push(conditionText(guard, false));
  }

  if (data.loop !== undefined) {
    parts.push(
      "maxIterations" in data.loop
        ? `↻ ≤ ${String(data.loop.maxIterations)}`
        : "↻ d",
    );
  }

  // In a first-match group the priority is the routing order, so it is shown
  // even at 0; under all-matches routing priority is inert and never shown.
  if ((data.routeMode ?? "allMatches") === "firstMatch") {
    parts.push(`#${String(data.priority ?? 0)}`);
  }

  const noMatch = data.noMatch ?? "fail";
  if (noMatch !== "fail") {
    parts.push(noMatch === "skip" ? "∅→skip" : "∅→done");
  }

  return parts.length === 0 ? null : parts.join(" · ");
}
