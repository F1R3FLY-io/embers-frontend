import type { Graph } from "@f1r3fly-io/embers-client-sdk";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";

import {
  fromApiGraph,
  makeNodeId,
  makeSubgraphId,
  toApiGraph,
} from "@/lib/graph";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeNode(id: string, type: Node["type"], parentId?: string): Node {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return { data: {}, id, parentId, position: { x: 0, y: 0 }, type } as any;
}

function makeContainer(id: string): Node {
  return makeNode(id, "deploy-container");
}

function makeEdge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}

// ---------------------------------------------------------------------------
// Type-narrowing helpers for Graph assertions
// ---------------------------------------------------------------------------

function expectTensor(
  g: Graph,
): Graph & { graph_1: Graph; graph_2: Graph; type: "Tensor" } {
  expect(g.type).toBe("Tensor");
  return g as Graph & { graph_1: Graph; graph_2: Graph; type: "Tensor" };
}

function expectNil(g: Graph) {
  expect(g.type).toBe("Nil");
}

function expectContext(g: Graph): Graph & {
  graph: Graph;
  name: { type: string; value: string };
  string: string;
  type: "Context";
} {
  expect(g.type).toBe("Context");
  return g as Graph & {
    graph: Graph;
    name: { type: string; value: string };
    string: string;
    type: "Context";
  };
}

// ---------------------------------------------------------------------------
// Tests: toApiGraph
// ---------------------------------------------------------------------------

describe("toApiGraph", () => {
  // eslint-disable-next-line jest/expect-expect
  test("no orphan nodes: graph_1 is subgraphs directly (Context, not Tensor)", () => {
    const nodes = [
      makeContainer("C1"),
      makeNode("n1", "input-node", "C1"),
      makeNode("n2", "output-node", "C1"),
    ];
    const edges = [makeEdge("n1", "n2")];

    const result = toApiGraph(nodes, edges);

    // Outer wrapper is always Tensor
    const outer = expectTensor(result);

    // graph_1 should be the subgraph directly (Context), NOT a nested Tensor
    expectContext(outer.graph_1);
  });

  // eslint-disable-next-line jest/expect-expect
  test("with orphan nodes: graph_1 is Tensor of {subgraphs, orphanNodeGraph}", () => {
    const nodes = [
      makeContainer("C1"),
      makeNode("n1", "input-node", "C1"),
      makeNode("n2", "text-model"), // orphan -- no parentId
    ];
    const edges = [makeEdge("n1", "n2")];

    const result = toApiGraph(nodes, edges);

    const outer = expectTensor(result);

    // graph_1 should be a Tensor wrapping subgraphs + orphan graph
    const inner = expectTensor(outer.graph_1);

    // inner.graph_1 = subgraphs (Context for C1)
    expectContext(inner.graph_1);

    // inner.graph_2 = orphan node graph (Context for n2)
    expectContext(inner.graph_2);
  });

  // eslint-disable-next-line jest/expect-expect
  test("all nodes are orphans (no containers): graph_1 is Tensor of {Nil, orphanGraph}", () => {
    const nodes = [makeNode("n1", "input-node"), makeNode("n2", "output-node")];
    const edges = [makeEdge("n1", "n2")];

    const result = toApiGraph(nodes, edges);

    const outer = expectTensor(result);
    const inner = expectTensor(outer.graph_1);

    // No containers => subgraphs is Nil
    expectNil(inner.graph_1);

    // Orphan nodes present
    expectContext(inner.graph_2);
  });

  // eslint-disable-next-line jest/expect-expect
  test("empty nodes and edges: both graph_1 and graph_2 are Nil", () => {
    const result = toApiGraph([], []);

    const outer = expectTensor(result);

    // No containers, no orphans => subgraphs (Nil) returned directly
    expectNil(outer.graph_1);
    // No edges
    expectNil(outer.graph_2);
  });

  // eslint-disable-next-line jest/expect-expect
  test("container with no children + orphan: orphan is detected, container is not treated as orphan", () => {
    const nodes = [
      makeContainer("C1"),
      makeNode("n1", "compress"), // orphan
    ];
    const edges: Edge[] = [];

    const result = toApiGraph(nodes, edges);

    const outer = expectTensor(result);

    // Orphan exists => inner Tensor
    const inner = expectTensor(outer.graph_1);

    // Subgraphs has the container (Context)
    expectContext(inner.graph_1);

    // Orphan node
    expectContext(inner.graph_2);
  });

  // eslint-disable-next-line jest/expect-expect
  test("only deploy-container (no children, no orphans): container excluded from orphans", () => {
    const nodes = [makeContainer("C1")];
    const edges: Edge[] = [];

    const result = toApiGraph(nodes, edges);

    const outer = expectTensor(result);

    // No orphans => graph_1 is subgraphs directly (Context for C1)
    expectContext(outer.graph_1);
  });

  // eslint-disable-next-line jest/expect-expect
  test("multiple containers + some orphans: all containers in subgraphs, orphans separate", () => {
    const nodes = [
      makeContainer("C1"),
      makeContainer("C2"),
      makeNode("n1", "input-node", "C1"),
      makeNode("n2", "output-node", "C2"),
      makeNode("n3", "tti-model"), // orphan
    ];
    const edges = [makeEdge("n1", "n2")];

    const result = toApiGraph(nodes, edges);

    const outer = expectTensor(result);

    // Orphan present => inner Tensor
    const inner = expectTensor(outer.graph_1);

    // Subgraphs should contain both containers (nested Context > Subgraph)
    expectContext(inner.graph_1);

    // Orphan node
    expectContext(inner.graph_2);
  });
});

// ---------------------------------------------------------------------------
// Tests: fromApiGraph roundtrip
// ---------------------------------------------------------------------------

describe("fromApiGraph roundtrip", () => {
  test("preserves structure for contained nodes", () => {
    const nodes = [
      makeContainer("C1"),
      makeNode("n1", "input-node", "C1"),
      makeNode("n2", "output-node", "C1"),
    ];
    const edges = [makeEdge("n1", "n2")];

    const graph = toApiGraph(nodes, edges);
    const [resultNodes, resultEdges] = fromApiGraph(graph);

    // Check node IDs present
    const nodeIds = resultNodes.map((n) => n.id);
    expect(nodeIds).toContain("C1");
    expect(nodeIds).toContain("n1");
    expect(nodeIds).toContain("n2");

    // Check parentId mappings
    const n1 = resultNodes.find((n) => n.id === "n1")!;
    const n2 = resultNodes.find((n) => n.id === "n2")!;
    expect(n1.parentId).toBe("C1");
    expect(n2.parentId).toBe("C1");

    // Check node types
    expect(n1.type).toBe("input-node");
    expect(n2.type).toBe("output-node");

    // Check edge (source/target, ignore ID since fromApiGraph generates new UUIDs)
    expect(resultEdges).toHaveLength(1);
    expect(resultEdges[0].source).toBe("n1");
    expect(resultEdges[0].target).toBe("n2");
  });

  test("preserves structure for orphan nodes (no parentId)", () => {
    const nodes = [
      makeContainer("C1"),
      makeNode("n1", "input-node", "C1"),
      makeNode("n2", "text-model"), // orphan
    ];
    const edges = [makeEdge("n1", "n2")];

    const graph = toApiGraph(nodes, edges);
    const [resultNodes, resultEdges] = fromApiGraph(graph);

    const nodeIds = resultNodes.map((n) => n.id);
    expect(nodeIds).toContain("C1");
    expect(nodeIds).toContain("n1");
    expect(nodeIds).toContain("n2");

    // n1 is in C1, n2 is orphan
    const n1 = resultNodes.find((n) => n.id === "n1")!;
    const n2 = resultNodes.find((n) => n.id === "n2")!;
    expect(n1.parentId).toBe("C1");
    expect(n2.parentId).toBeUndefined();

    // Edge preserved
    expect(resultEdges).toHaveLength(1);
    expect(resultEdges[0].source).toBe("n1");
    expect(resultEdges[0].target).toBe("n2");
  });

  test("preserves structure for all-orphan graph", () => {
    const nodes = [makeNode("n1", "input-node"), makeNode("n2", "output-node")];
    const edges = [makeEdge("n1", "n2")];

    const graph = toApiGraph(nodes, edges);
    const [resultNodes, resultEdges] = fromApiGraph(graph);

    const nodeIds = resultNodes.map((n) => n.id);
    expect(nodeIds).toContain("n1");
    expect(nodeIds).toContain("n2");

    // All orphans -- no parentId
    for (const node of resultNodes) {
      expect(node.parentId).toBeUndefined();
    }

    expect(resultEdges).toHaveLength(1);
    expect(resultEdges[0].source).toBe("n1");
    expect(resultEdges[0].target).toBe("n2");
  });
});

// ---------------------------------------------------------------------------
// Tests: makeNodeId / makeSubgraphId
// ---------------------------------------------------------------------------

describe("makeNodeId / makeSubgraphId", () => {
  test("makeNodeId returns a VVar-compatible id starting with lowercase 'a'", () => {
    const id = makeNodeId();
    expect(id[0]).toBe("a");
    expect(id).toMatch(/^a[a-f0-9]{32}$/);
    expect(id).toHaveLength(33);
  });

  test("makeSubgraphId returns a GVar-compatible id starting with uppercase 'A'", () => {
    const id = makeSubgraphId();
    expect(id[0]).toBe("A");
    expect(id).toMatch(/^A[a-f0-9]{32}$/);
    expect(id).toHaveLength(33);
  });
});

// ---------------------------------------------------------------------------
// Tests: fan-out and fan-in
//
// A team that broadcasts one agent's output to several sinks and then joins
// those back into one agent depends on the edge list surviving `toApiGraph` ->
// `fromApiGraph` intact. The reverse path rebuilds edges through an adjacency
// list (`Map<string, Set<string>>`), which is correct for this shape but would
// silently collapse edges if that structure were ever simplified.
// ---------------------------------------------------------------------------

function makeAgentNode(id: string, name: string): Node {
  // Narrow to the agent variant so its `data` accepts the identity fields;
  // spreading the union would widen back to the container variant.
  const node: Extract<Node, { type: "agent" }> = {
    data: {
      agentId: `${id}-id`,
      agentName: name,
      agentVersion: "v1",
    },
    id,
    position: { x: 0, y: 0 },
    type: "agent",
  };
  return node;
}

/** The red-team shape: 1->4 broadcast from the hypothesis, 5->1 join into the refiner. */
function redTeam(): { edges: Edge[]; nodes: Node[] } {
  const nodes = [
    makeNode("aIn", "input-node"),
    makeAgentNode("aHyp", "Hypothesize"),
    makeAgentNode("aLog", "LogicCritic"),
    makeAgentNode("aEvi", "EvidenceCritic"),
    makeAgentNode("aFea", "FeasibilityCritic"),
    makeAgentNode("aRef", "Refine"),
    makeAgentNode("aCon", "Condense"),
    makeNode("aOut", "output-node"),
  ];

  const edges = [
    // the prompt reaches every reasoning node
    makeEdge("aIn", "aHyp"),
    makeEdge("aIn", "aLog"),
    makeEdge("aIn", "aEvi"),
    makeEdge("aIn", "aFea"),
    makeEdge("aIn", "aRef"),
    makeEdge("aIn", "aCon"),
    // the hypothesis broadcasts to the three critics and the refiner
    makeEdge("aHyp", "aLog"),
    makeEdge("aHyp", "aEvi"),
    makeEdge("aHyp", "aFea"),
    makeEdge("aHyp", "aRef"),
    // the critiques join into the refiner
    makeEdge("aLog", "aRef"),
    makeEdge("aEvi", "aRef"),
    makeEdge("aFea", "aRef"),
    // and out
    makeEdge("aRef", "aCon"),
    makeEdge("aCon", "aOut"),
  ];

  return { edges, nodes };
}

const asPairs = (edges: Edge[]) =>
  new Set(edges.map((edge) => `${edge.source}->${edge.target}`));

describe("fan-out and fan-in", () => {
  it("round-trips every edge of a 1->4 broadcast and a 5->1 join", () => {
    const { edges, nodes } = redTeam();

    const [, restored] = fromApiGraph(toApiGraph(nodes, edges));

    // Compare the pairs, not just the count: a count-only assertion would pass
    // even if two edges were swapped for two duplicates of a third.
    expect(asPairs(restored)).toEqual(asPairs(edges));
    expect(restored).toHaveLength(edges.length);
  });

  it("keeps all four targets of the broadcast", () => {
    const { edges, nodes } = redTeam();

    const [, restored] = fromApiGraph(toApiGraph(nodes, edges));

    const fromHypothesis = restored
      .filter((edge) => edge.source === "aHyp")
      .map((edge) => edge.target)
      .sort();
    expect(fromHypothesis).toEqual(["aEvi", "aFea", "aLog", "aRef"]);
  });

  it("keeps all five sources of the join", () => {
    const { edges, nodes } = redTeam();

    const [, restored] = fromApiGraph(toApiGraph(nodes, edges));

    const intoRefiner = restored
      .filter((edge) => edge.target === "aRef")
      .map((edge) => edge.source)
      .sort();
    expect(intoRefiner).toEqual(["aEvi", "aFea", "aHyp", "aIn", "aLog"]);
  });

  it("round-trips each agent's identity, which names its key downstream", () => {
    const { edges, nodes } = redTeam();

    const [restoredNodes] = fromApiGraph(toApiGraph(nodes, edges));

    const refiner = restoredNodes.find((node) => node.id === "aRef");
    expect(refiner?.type).toBe("agent");
    expect(refiner?.data).toMatchObject({
      agentId: "aRef-id",
      agentName: "Refine",
      agentVersion: "v1",
    });
  });
});
