import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";
import type { WorkflowDefinitionV2 } from "@/lib/workflow";

import { edgeAnnotation } from "@/lib/components/GraphEditor/WorkflowEdge/edgeAnnotation";
import {
  activityReferenceFromJson,
  conditionFromJson,
  fromWorkflowDefinition,
  toWorkflowDefinition,
  validateWorkflow,
} from "@/lib/workflow";

function node(id: string, type: Node["type"], data = {}): Node {
  return { data, id, position: { x: 0, y: 0 }, type } as Node;
}

function edge(source: string, target: string, data = {}): Edge {
  return { data, id: `${source}-${target}`, source, target };
}

describe("WorkflowDefinition v2", () => {
  test("keeps stable edge semantics and typed branching", () => {
    const definition = toWorkflowDefinition(
      [
        node("in", "input-node"),
        node("choice", "gateway"),
        node("yes", "text-model"),
        node("no", "compress"),
        node("out", "output-node"),
      ],
      [
        edge("in", "choice"),
        edge("choice", "yes", {
          guard: {
            kind: "compare",
            left: { kind: "path", path: ["approved"], root: "input" },
            operator: "eq",
            right: { kind: "literal", value: true },
          },
          priority: 0,
          routeMode: "firstMatch",
        }),
        edge("choice", "no", {
          guard: { kind: "literal", value: true },
          priority: 1,
          routeMode: "firstMatch",
        }),
        edge("yes", "out"),
        edge("no", "out"),
      ],
    );

    expect(definition.schemaVersion).toBe("2.0");
    expect(definition.transitions["choice-yes"].priority).toBe(0);
    expect(definition.routeGroups["route:choice:completed"]).toMatchObject({
      mode: "firstMatch",
    });
    expect(definition.nodes.out.join).toEqual({
      correlation: { kind: "root" },
      mode: "all",
    });
    expect(validateWorkflow(definition)).toEqual([]);
  });

  test("rejects an unbounded hot cycle", () => {
    const definition = toWorkflowDefinition(
      [node("in", "input-node"), node("loop", "compress")],
      [edge("in", "loop"), edge("loop", "loop")],
    );

    expect(validateWorkflow(definition)).toContainEqual(
      expect.objectContaining({ code: "cycle-without-progress" }),
    );
  });

  test("accepts a bounded cyclic edge", () => {
    const definition = toWorkflowDefinition(
      [node("in", "input-node"), node("loop", "compress")],
      [
        edge("in", "loop"),
        edge("loop", "loop", { loop: { maxIterations: 10 } }),
      ],
    );

    expect(validateWorkflow(definition)).toEqual([]);
    expect(definition.transitions["loop-loop"].loop).toEqual({
      maxIterations: 10,
    });
  });

  test("rejects unsafe loop bounds and undeclared pure-guard inputs", () => {
    const definition = toWorkflowDefinition(
      [node("in", "input-node"), node("loop", "compress")],
      [
        edge("in", "loop"),
        edge("loop", "loop", {
          guard: {
            inputs: {},
            kind: "rholang",
            source: "$missing == true",
          },
          loop: { maxIterations: 0 },
        }),
      ],
    );
    const diagnostics = validateWorkflow(definition);

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: "undeclared-rholang-input" }),
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: "invalid-loop-bound" }),
    );
  });

  test("accepts a durable cycle containing a wait", () => {
    const definition = toWorkflowDefinition(
      [
        node("in", "input-node"),
        node("work", "compress"),
        node("wait", "wait", { waitFor: "event" }),
      ],
      [edge("in", "work"), edge("work", "wait"), edge("wait", "work")],
    );

    expect(validateWorkflow(definition)).toEqual([]);
  });

  test("rejects a hot subcycle that can bypass another bounded edge", () => {
    const definition = toWorkflowDefinition(
      [node("in", "input-node"), node("a", "compress"), node("b", "compress")],
      [
        edge("in", "a"),
        edge("a", "b", { loop: { maxIterations: 10 } }),
        edge("b", "a"),
        edge("a", "a"),
      ],
    );

    expect(validateWorkflow(definition)).toContainEqual(
      expect.objectContaining({ code: "cycle-without-progress", id: "a" }),
    );
  });

  test("round-trips transition semantics through the canvas projection", () => {
    const original = toWorkflowDefinition(
      [node("in", "input-node"), node("out", "output-node")],
      [
        edge("in", "out", {
          guard: { kind: "literal", value: false },
          loop: { durableYield: true },
          noMatch: "complete",
          priority: 7,
          routeMode: "firstMatch",
          transitionId: "stable-transition",
          trigger: "failed",
        }),
      ],
    );
    const [nodes, edges] = fromWorkflowDefinition(original);
    const roundTrip = toWorkflowDefinition(nodes, edges);

    expect(roundTrip.transitions["stable-transition"]).toEqual(
      original.transitions["stable-transition"],
    );
    expect(roundTrip.routeGroups["route:in:failed"]).toEqual(
      original.routeGroups["route:in:failed"],
    );
  });

  test("projects a backend-reloaded definition whose optionals are explicit null", () => {
    // The editor emits a default edge by omitting guard/loop/ports; the
    // backend round-trips that as explicit `null` (its Rust Option fields
    // carry no skip_serializing_if). Reproduce that exact on-the-wire shape
    // and prove the projection normalizes it to key-absent `undefined` and
    // the annotation stays silent -- the regression that blanked the editor
    // with "Cannot read properties of null (reading 'kind')".
    const base = toWorkflowDefinition(
      [node("in", "input-node"), node("out", "output-node")],
      [edge("in", "out")],
    );
    const [transitionId] = Object.keys(base.transitions);
    const backendShaped = {
      ...base,
      transitions: {
        [transitionId]: {
          ...base.transitions[transitionId],
          guard: null,
          loop: null,
          sourcePort: null,
          targetPort: null,
        },
      },
    } as unknown as WorkflowDefinitionV2;

    const [, edges] = fromWorkflowDefinition(backendShaped);
    const projected = edges[0];

    expect(projected.data?.guard).toBeUndefined();
    expect(projected.data?.loop).toBeUndefined();
    expect(projected.sourceHandle).toBeUndefined();
    expect(projected.targetHandle).toBeUndefined();
    expect(edgeAnnotation(projected.data)).toBeNull();
  });

  test("accepts and round-trips the approval rejection disposition", () => {
    const original = toWorkflowDefinition(
      [
        node("in", "input-node"),
        node("review", "approval", {
          approvers: "alice, bob",
          policyId: "review-policy",
          quorum: 2,
        }),
        node("out", "output-node"),
      ],
      [edge("in", "review"), edge("review", "out", { trigger: "rejected" })],
    );

    expect(validateWorkflow(original)).toEqual([]);
    const [nodes, edges] = fromWorkflowDefinition(original);
    const roundTrip = toWorkflowDefinition(nodes, edges);
    expect(roundTrip.transitions["review-out"].trigger).toBe("rejected");
    expect(roundTrip.routeGroups["route:review:rejected"]).toBeDefined();
  });

  test("does not allow dangling transitions into a definition", () => {
    const definition = toWorkflowDefinition(
      [node("in", "input-node"), node("out", "output-node")],
      [edge("in", "ghost"), edge("in", "out")],
    );

    expect(Object.keys(definition.transitions)).toEqual(["in-out"]);
    expect(validateWorkflow(definition)).toEqual([]);
  });

  test("losslessly round-trips hierarchy, node kinds, policies, and route identities", () => {
    const definition: WorkflowDefinitionV2 = {
      entryScopeId: "root:custom",
      interface: {
        inputs: {
          request: {
            fields: { approved: { kind: "bool" }, prompt: { kind: "string" } },
            kind: "record",
          },
        },
        outputs: { response: { kind: "string" } },
      },
      nodes: {
        agent: {
          activity: {
            agentId: "agent:reviewer",
            agentVersion: "sha256:reviewer-v3",
            kind: "agent",
            protocol: "structured-v1",
          },
          id: "agent",
          kind: "activity",
          label: "Structured reviewer",
          policy: {
            authorities: ["cap:read", "cap:reply"],
            compensation: { kind: "builtin", name: "compress" },
            maxOutputBytes: 4096,
            retry: {
              backoffMultiplierMillis: 1500,
              deterministicJitter: false,
              initialDelayMillis: 250,
              maxAttempts: 3,
              maxDelayMillis: 5000,
              retryOn: ["failed", "timedOut"],
            },
            timeout: { afterMillis: 30_000 },
          },
          scopeId: "scope:inner",
        },
        final: {
          id: "final",
          kind: "final",
          label: "Complete",
          scopeId: "scope:inner",
        },
        "inner-entry": {
          id: "inner-entry",
          kind: "input",
          label: "Inner entry",
          scopeId: "scope:inner",
        },
        "inner-owner": {
          childScopeId: "scope:inner",
          id: "inner-owner",
          kind: "scope",
          label: "Inner state",
          scopeId: "scope:outer",
        },
        "outer-entry": {
          id: "outer-entry",
          kind: "input",
          label: "Outer entry",
          scopeId: "scope:outer",
        },
        "outer-owner": {
          childScopeId: "scope:outer",
          id: "outer-owner",
          kind: "scope",
          label: "Outer state",
          scopeId: "root:custom",
        },
        prep: {
          activity: { kind: "builtin", name: "compress" },
          id: "prep",
          kind: "activity",
          label: "Lifecycle prep",
          scopeId: "scope:inner",
        },
        root: {
          id: "root",
          kind: "input",
          label: "Root input",
          scopeId: "root:custom",
        },
        transform: {
          id: "transform",
          join: {
            correlation: {
              kind: "routeGroup",
              routeGroupId: "route:review",
            },
            mode: "each",
          },
          kind: "transform",
          label: "Fan-in envelope",
          scopeId: "scope:inner",
          transform: "fan-in-map",
        },
      },
      policies: { defaultExecution: "bounded", visibility: "private" },
      presentation: {
        edges: {
          "review-ready": { label: "reviewReady: approved and present" },
        },
        nodes: {
          agent: { height: 120, width: 260, x: 60, y: 80 },
          final: { x: 500, y: 80 },
          "inner-entry": { x: 10, y: 80 },
          "inner-owner": { height: 320, width: 720, x: 40, y: 40 },
          "outer-entry": { x: 10, y: 40 },
          "outer-owner": { height: 480, width: 960, x: 100, y: 120 },
          prep: { x: 180, y: 160 },
          root: { x: 0, y: 0 },
          transform: { x: 340, y: 80 },
        },
      },
      routeGroups: {
        "route:review": {
          id: "route:review",
          mode: "firstMatch",
          noMatch: "complete",
        },
      },
      schemaVersion: "2.0",
      scopes: {
        "root:custom": {
          entryActivities: [],
          exitActivities: [],
          history: "none",
          id: "root:custom",
          initialNodeIds: ["root"],
          kind: "root",
          label: "Customer support team",
        },
        "scope:inner": {
          entryActivities: ["prep"],
          exitActivities: ["prep"],
          history: "deep",
          id: "scope:inner",
          initialNodeIds: ["inner-entry"],
          kind: "compound",
          label: "Inner state",
          parentScopeId: "scope:outer",
        },
        "scope:outer": {
          entryActivities: [],
          exitActivities: [],
          history: "shallow",
          id: "scope:outer",
          initialNodeIds: ["outer-entry"],
          kind: "compound",
          label: "Outer state",
          parentScopeId: "root:custom",
        },
      },
      transitions: {
        "review-ready": {
          guard: {
            kind: "all",
            operands: [
              {
                kind: "compare",
                left: { kind: "path", path: ["approved"], root: "input" },
                operator: "eq",
                right: { kind: "literal", value: true },
              },
              {
                kind: "not",
                operand: {
                  expression: {
                    kind: "path",
                    path: ["blocked"],
                    root: "state",
                  },
                  kind: "exists",
                },
              },
            ],
          },
          id: "review-ready",
          loop: { durableYield: true },
          priority: 4,
          routeGroupId: "route:review",
          sourceNodeId: "agent",
          targetNodeId: "transform",
          trigger: "custom:reviewReady",
        },
      },
      types: { ReviewId: { kind: "string" } },
    };

    expect(validateWorkflow(definition)).toEqual([]);
    const [canvasNodes, canvasEdges] = fromWorkflowDefinition(definition);

    expect(
      canvasNodes
        .filter(({ type }) => type === "deploy-container")
        .map(({ id }) => id),
    ).toEqual(["outer-owner", "inner-owner"]);
    expect(canvasNodes.find(({ id }) => id === "final")?.type).toBe(
      "final-node",
    );
    expect(canvasNodes.find(({ id }) => id === "transform")?.type).toBe(
      "fan-in-map",
    );

    expect(toWorkflowDefinition(canvasNodes, canvasEdges, definition)).toEqual(
      definition,
    );
  });

  test("parses the complete condition and compensation activity languages", () => {
    expect(
      conditionFromJson(
        JSON.stringify({
          kind: "any",
          operands: [
            { kind: "literal", value: false },
            {
              kind: "not",
              operand: {
                expression: { kind: "path", path: ["error"], root: "state" },
                kind: "exists",
              },
            },
          ],
        }),
      ),
    ).toMatchObject({ kind: "any" });
    expect(
      activityReferenceFromJson(
        '{"kind":"workflow","teamId":"rho:id:child","version":"abc"}',
      ),
    ).toEqual({ kind: "workflow", teamId: "rho:id:child", version: "abc" });

    expect(() => conditionFromJson('{"kind":"all","operands":[]}')).toThrow(
      "non-empty array",
    );
    expect(() =>
      activityReferenceFromJson(
        '{"kind":"agent","agentId":"a","agentVersion":"v","protocol":"unknown"}',
      ),
    ).toThrow("simple-v1 or structured-v1");
  });

  test("diagnoses duplicate ownership and cycles in the scope tree", () => {
    const definition = toWorkflowDefinition(
      [node("in", "input-node"), node("scope-node", "deploy-container")],
      [],
    );
    const childScopeId = (
      definition.nodes["scope-node"] as { childScopeId: string }
    ).childScopeId;
    definition.nodes["second-owner"] = {
      childScopeId,
      id: "second-owner",
      kind: "scope",
      label: "Second owner",
      scopeId: definition.entryScopeId,
    };
    definition.scopes[childScopeId].parentScopeId = childScopeId;

    expect(validateWorkflow(definition)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-scope-owner-count" }),
        expect.objectContaining({ code: "scope-parent-cycle" }),
      ]),
    );
  });

  test("requires a timedOut route when an approval declares a timeout", () => {
    const definition = toWorkflowDefinition(
      [
        node("in", "input-node"),
        node("gate", "approval"),
        node("out", "output-node"),
      ],
      [edge("in", "gate"), edge("gate", "out")],
    );
    definition.nodes.gate.policy = {
      authorities: [],
      timeout: { afterMillis: 1000 },
    };

    expect(validateWorkflow(definition)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "approval-timeout-unrouted" }),
      ]),
    );

    definition.routeGroups["route:gate:timedOut"] = {
      id: "route:gate:timedOut",
      mode: "allMatches",
      noMatch: "fail",
    };
    definition.transitions["gate-late"] = {
      id: "gate-late",
      priority: 0,
      routeGroupId: "route:gate:timedOut",
      sourceNodeId: "gate",
      targetNodeId: "out",
      trigger: "timedOut",
    };
    expect(
      validateWorkflow(definition).some(
        (diagnostic) => diagnostic.code === "approval-timeout-unrouted",
      ),
    ).toBe(false);

    delete definition.transitions["gate-late"];
    delete definition.routeGroups["route:gate:timedOut"];
    definition.nodes.gate.policy = undefined;
    expect(
      validateWorkflow(definition).some(
        (diagnostic) => diagnostic.code === "approval-timeout-unrouted",
      ),
    ).toBe(false);
  });

  test("timer deadline literals must be RFC 3339 timestamps", () => {
    const withLiteral = (value: unknown) => {
      const definition = toWorkflowDefinition(
        [node("in", "input-node"), node("out", "output-node")],
        [edge("in", "out")],
      );
      definition.nodes.timer = {
        id: "timer",
        kind: "wait",
        label: "Timer",
        scopeId: definition.entryScopeId,
        timer: { deadline: { kind: "literal", value } },
        waitFor: "timer",
      } as (typeof definition.nodes)[string];
      return validateWorkflow(definition).some(
        (diagnostic) => diagnostic.code === "invalid-timer-deadline-literal",
      );
    };

    // Parity vectors pinned against the backend validator, whose truth is
    // chrono's RFC 3339 parser (timer_deadline_literals_must_be_rfc3339).
    for (const valid of [
      "2026-01-01T00:00:00Z",
      "2026-01-01T00:00:00+00:00",
      "2026-01-01T00:00:00.123Z",
      "2026-01-01t00:00:00z",
      "2026-01-01 00:00:00Z",
    ]) {
      expect(withLiteral(valid)).toBe(false);
    }
    for (const invalid of [
      "2026-01-01",
      "not-a-date",
      "2026-01-01T00:00:00",
      42,
    ]) {
      expect(withLiteral(invalid)).toBe(true);
    }
  });

  test("lifecycle activities may only route into activities", () => {
    const definition = toWorkflowDefinition(
      [
        node("in", "input-node"),
        node("prep", "compress"),
        node("recover", "compress"),
        node("gate", "gateway"),
        node("out", "output-node"),
      ],
      [
        edge("in", "prep"),
        edge("prep", "gate"),
        edge("prep", "recover"),
        edge("gate", "out"),
      ],
    );
    definition.scopes[definition.entryScopeId].entryActivities = ["prep"];

    const diagnostics = validateWorkflow(definition).filter(
      (diagnostic) => diagnostic.code === "invalid-lifecycle-route-target",
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.id).toBe("prep-gate");
    expect(diagnostics[0]?.message).toContain("is not an activity");

    delete definition.transitions["prep-gate"];
    expect(
      validateWorkflow(definition).some(
        (diagnostic) => diagnostic.code === "invalid-lifecycle-route-target",
      ),
    ).toBe(false);
  });

  test("rejects conflicting policies for one preserved route group", () => {
    expect(() =>
      toWorkflowDefinition(
        [
          node("in", "input-node"),
          node("a", "output-node"),
          node("b", "output-node"),
        ],
        [
          edge("in", "a", {
            routeGroupId: "route:stable",
            routeMode: "firstMatch",
          }),
          edge("in", "b", {
            routeGroupId: "route:stable",
            routeMode: "allMatches",
          }),
        ],
      ),
    ).toThrow("conflicting routing or no-match policies");
  });

  test("enforces publication trust-boundary parity in the editor", () => {
    const definition = toWorkflowDefinition(
      [node("in", "input-node"), node("out", "output-node")],
      [edge("in", "out")],
    );
    const transition = definition.transitions["in-out"];
    transition.id = "embedded-id-does-not-match";
    transition.priority = 0.5;
    transition.sourcePort = " ";
    transition.trigger = "custom:";
    transition.guard = {
      inputs: { output: { path: [], root: "output" } },
      kind: "rholang",
      source: "$output == true",
      sourceHash: "0".repeat(64),
    };
    definition.nodes.in.policy = {
      authorities: ["cap:read", "cap:read", " "],
    };
    definition.nodes.timer = {
      id: "timer",
      kind: "wait",
      label: "Timer",
      scopeId: definition.entryScopeId,
      signal: "also-a-signal",
      timer: {
        deadline: { kind: "literal", value: "not-a-timestamp" },
        delayMillis: 0,
      },
      waitFor: "timer",
    };
    definition.scopes[definition.entryScopeId].entryActivities = ["in"];
    definition.nodes.gate = {
      approvers: ["alice"],
      id: "gate",
      kind: "approval",
      label: "Gate",
      policy: { authorities: [], timeout: { afterMillis: 1000 } },
      policyId: "owner",
      quorum: 1,
      scopeId: definition.entryScopeId,
    };

    expect(validateWorkflow(definition)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "identity-map-mismatch" }),
        expect.objectContaining({ code: "duplicate-authority" }),
        expect.objectContaining({ code: "empty-authority" }),
        expect.objectContaining({ code: "invalid-timer-policy" }),
        expect.objectContaining({ code: "invalid-timer-delay" }),
        expect.objectContaining({ code: "timer-has-signal" }),
        expect.objectContaining({ code: "invalid-scope-lifecycle-activity" }),
        expect.objectContaining({ code: "invalid-transition-trigger" }),
        expect.objectContaining({ code: "empty-source-port" }),
        expect.objectContaining({ code: "invalid-transition-priority" }),
        expect.objectContaining({ code: "mismatched-rholang-guard-hash" }),
        expect.objectContaining({ code: "approval-timeout-unrouted" }),
        expect.objectContaining({ code: "invalid-timer-deadline-literal" }),
        expect.objectContaining({ code: "invalid-lifecycle-route-target" }),
      ]),
    );
  });
});
