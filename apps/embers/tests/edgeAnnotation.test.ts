import type { Condition, WorkflowEdgeData } from "@/lib/workflow";

import { edgeAnnotation } from "@/lib/components/GraphEditor/WorkflowEdge/edgeAnnotation";

// The annotation contract: a fully default transition earns NO ink, and every
// deviation compresses to a fixed-order symbolic form. These tests pin the
// default-silent rule and each symbol so a rendering change can never quietly
// re-introduce the labelled-by-default canvas.

const score: Condition = {
  kind: "compare",
  left: { kind: "path", path: ["score"], root: "output" },
  operator: "ge",
  right: { kind: "literal", value: 0.8 },
};

describe("default transitions are silent", () => {
  it("returns null for undefined data", () => {
    expect(edgeAnnotation(undefined)).toBeNull();
  });

  it("returns null when every field is at its default", () => {
    const data: WorkflowEdgeData = {
      noMatch: "fail",
      priority: 0,
      routeMode: "allMatches",
      transitionId: "t1",
      trigger: "completed",
    };
    expect(edgeAnnotation(data)).toBeNull();
  });

  it("returns null for empty data (all defaults implied)", () => {
    expect(edgeAnnotation({})).toBeNull();
  });

  it("treats a literal-true guard as no guard", () => {
    expect(
      edgeAnnotation({ guard: { kind: "literal", value: true } }),
    ).toBeNull();
  });

  it("ignores priority under all-matches routing, where it is inert", () => {
    expect(edgeAnnotation({ priority: 5, routeMode: "allMatches" })).toBeNull();
  });

  // The backend serializes absent optionals as explicit null; a reloaded
  // definition therefore hands the helper null where an editor-fresh one
  // omits the key. These pin that null never reaches `.kind` / `in null`.
  it("treats an explicit-null guard as no guard", () => {
    expect(
      edgeAnnotation({ guard: null } as unknown as WorkflowEdgeData),
    ).toBeNull();
  });

  it("treats an explicit-null loop as no loop", () => {
    expect(
      edgeAnnotation({ loop: null } as unknown as WorkflowEdgeData),
    ).toBeNull();
  });

  it("composes a fully-null backend-shaped edge without throwing", () => {
    const backendNulls = {
      guard: null,
      loop: null,
      noMatch: null,
      priority: null,
      routeMode: null,
      trigger: null,
    } as unknown as WorkflowEdgeData;
    expect(edgeAnnotation(backendNulls)).toBeNull();
  });
});

describe("trigger deviations", () => {
  it("shows a non-default disposition by name", () => {
    expect(edgeAnnotation({ trigger: "failed" })).toBe("failed");
    expect(edgeAnnotation({ trigger: "timedOut" })).toBe("timedOut");
  });

  it("shows a custom trigger without its prefix", () => {
    expect(edgeAnnotation({ trigger: "custom:review-done" })).toBe(
      "review-done",
    );
  });
});

describe("guards compress to mathematical notation", () => {
  it("renders comparisons with operator glyphs", () => {
    expect(edgeAnnotation({ guard: score })).toBe("output.score ≥ 0.8");
    expect(
      edgeAnnotation({
        guard: {
          kind: "compare",
          left: { kind: "path", path: ["attempts"], root: "state" },
          operator: "ne",
          right: { kind: "literal", value: "final" },
        },
      }),
    ).toBe('state.attempts ≠ "final"');
  });

  it("renders existence, negation, and a literal-false guard", () => {
    expect(
      edgeAnnotation({
        guard: {
          expression: { kind: "path", path: ["flag"], root: "state" },
          kind: "exists",
        },
      }),
    ).toBe("∃ state.flag");
    expect(edgeAnnotation({ guard: { kind: "not", operand: score } })).toBe(
      "¬(output.score ≥ 0.8)",
    );
    expect(edgeAnnotation({ guard: { kind: "literal", value: false } })).toBe(
      "⊥",
    );
  });

  it("joins conjunctions and disjunctions, parenthesizing nested groups", () => {
    const exists: Condition = {
      expression: { kind: "path", path: ["flag"], root: "state" },
      kind: "exists",
    };
    expect(
      edgeAnnotation({ guard: { kind: "all", operands: [score, exists] } }),
    ).toBe("(output.score ≥ 0.8) ∧ (∃ state.flag)");
    expect(
      edgeAnnotation({
        guard: {
          kind: "any",
          operands: [{ kind: "all", operands: [score, exists] }, exists],
        },
      }),
    ).toBe("((output.score ≥ 0.8) ∧ (∃ state.flag)) ∨ (∃ state.flag)");
  });

  it("marks Rholang guards with a language tag instead of their source", () => {
    expect(
      edgeAnnotation({
        guard: {
          inputs: {},
          kind: "rholang",
          source: "new x in { x!(true) }",
        },
      }),
    ).toBe("rho");
  });
});

describe("loop, priority, and no-match symbols", () => {
  it("renders bounded cycles with their bound and durable cycles with d", () => {
    expect(edgeAnnotation({ loop: { maxIterations: 10 } })).toBe("↻ ≤ 10");
    expect(edgeAnnotation({ loop: { durableYield: true } })).toBe("↻ d");
  });

  it("shows the routing order in first-match groups, even at zero", () => {
    expect(edgeAnnotation({ routeMode: "firstMatch" })).toBe("#0");
    expect(edgeAnnotation({ priority: 3, routeMode: "firstMatch" })).toBe("#3");
  });

  it("shows only non-default no-match policies", () => {
    expect(edgeAnnotation({ noMatch: "skip" })).toBe("∅→skip");
    expect(edgeAnnotation({ noMatch: "complete" })).toBe("∅→done");
  });
});

it("composes deviations in trigger, guard, loop, priority, no-match order", () => {
  const data: WorkflowEdgeData = {
    guard: score,
    loop: { maxIterations: 3 },
    noMatch: "skip",
    priority: 1,
    routeMode: "firstMatch",
    trigger: "failed",
  };
  expect(edgeAnnotation(data)).toBe(
    "failed · output.score ≥ 0.8 · ↻ ≤ 3 · #1 · ∅→skip",
  );
});
