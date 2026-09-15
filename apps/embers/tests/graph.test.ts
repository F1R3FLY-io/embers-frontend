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

// ---------------------------------------------------------------------------
// Tests: dangling edges
//
// Deleting a node used to leave its edges behind, producing a graph whose edges
// name a vertex that has no context. The backend rejects the whole graph, and
// because the editor cannot draw such an edge it showed nothing wrong -- so the
// phantom survived every reload and every save, and the team stayed undeployable.
// ---------------------------------------------------------------------------

/** An EdgeAnon in the shape `buildGraphEdges` emits, for endpoints that may not
 * be defined anywhere -- which is the situation under test, so it cannot be
 * produced via `toApiGraph`. */
function danglingEdge(source: string, target: string): Graph {
  return {
    binding_1: {
      graph: { type: "Nil" },
      var: source,
      vertex: { name: { type: "VVar", value: source } },
    },
    binding_2: {
      graph: { type: "Nil" },
      var: target,
      vertex: { name: { type: "VVar", value: target } },
    },
    type: "EdgeAnon",
  };
}

describe("dangling edges", () => {
  it("does not write an edge whose target no longer exists", () => {
    const nodes = [makeNode("n1", "input-node"), makeNode("n2", "output-node")];
    const edges = [makeEdge("n1", "n2"), makeEdge("n1", "ghost")];

    const [, restored] = fromApiGraph(toApiGraph(nodes, edges));

    expect(asPairs(restored)).toEqual(asPairs([makeEdge("n1", "n2")]));
  });

  it("does not write an edge whose source no longer exists", () => {
    const nodes = [makeNode("n1", "input-node"), makeNode("n2", "output-node")];
    const edges = [makeEdge("ghost", "n2"), makeEdge("n1", "n2")];

    const [, restored] = fromApiGraph(toApiGraph(nodes, edges));

    expect(asPairs(restored)).toEqual(asPairs([makeEdge("n1", "n2")]));
  });

  it("keeps every legitimate edge when discarding a dangling one", () => {
    const { edges, nodes } = redTeam();
    const withGhost = [...edges, makeEdge("aRef", "ghost")];

    const [, restored] = fromApiGraph(toApiGraph(nodes, withGhost));

    // Every real edge survives; only the ghost goes.
    expect(asPairs(restored)).toEqual(asPairs(edges));
    expect(restored).toHaveLength(edges.length);
  });

  it("treats an edge naming a deploy container as legitimate", () => {
    // `collectGraphParts` records a subgraph's own var as a vertex, so a
    // container id is a real endpoint and must not be mistaken for a ghost.
    const nodes = [
      makeContainer("C1"),
      makeNode("n1", "input-node", "C1"),
      makeNode("n2", "output-node"),
    ];
    const edges = [makeEdge("n1", "C1"), makeEdge("C1", "n2")];

    const [, restored] = fromApiGraph(toApiGraph(nodes, edges));

    expect(asPairs(restored)).toEqual(asPairs(edges));
  });

  it("drops an edge read back from a graph that never defined its vertex", () => {
    const nodes = [makeNode("n1", "input-node"), makeNode("n2", "output-node")];
    const corrupt: Graph = {
      graph_1: toApiGraph(nodes, [makeEdge("n1", "n2")]),
      graph_2: danglingEdge("n1", "ghost"),
      type: "Tensor",
    };

    const [restoredNodes, restoredEdges] = fromApiGraph(corrupt);

    expect(asPairs(restoredEdges)).toEqual(asPairs([makeEdge("n1", "n2")]));
    // The ghost must not become a node either -- it has no context, and
    // `buildNodes` throws for a context-less vertex.
    expect(restoredNodes.map((node) => node.id).sort()).toEqual(["n1", "n2"]);
  });

  it("heals a corrupted graph when it is opened and saved again", () => {
    // The repair path for teams already saved with a phantom edge: load, then
    // save, and what goes back is clean.
    const nodes = [makeNode("n1", "input-node"), makeNode("n2", "output-node")];
    const corrupt: Graph = {
      graph_1: toApiGraph(nodes, [makeEdge("n1", "n2")]),
      graph_2: danglingEdge("ghost", "n2"),
      type: "Tensor",
    };

    const [loadedNodes, loadedEdges] = fromApiGraph(corrupt);
    const [, resaved] = fromApiGraph(toApiGraph(loadedNodes, loadedEdges));

    expect(asPairs(resaved)).toEqual(asPairs([makeEdge("n1", "n2")]));
  });

  // -------------------------------------------------------------------------
  // The graph that actually broke, reproduced from chain
  // -------------------------------------------------------------------------

  // Ids and edges below are verbatim from RedTeam version 019fb096-f503, which
  // could not be deployed. The shape shows what the user did: a node between
  // Condense and Output was deleted and its neighbours rewired directly, which
  // left both of the deleted node's edges behind pointing at nothing.
  //
  // The deploy-container that graph also had is omitted: container handling is
  // covered separately above, and it plays no part in this defect.
  const REAL = {
    condense: "a3bf8f7979a504c9faf6eaf3aeef31b52",
    evidence: "aab5ef72c8fa54bfabfaaa16ae5dfa7c5",
    feasibility: "a64f522a9f3cc47bd870ec15f307a8b86",
    // The node that was deleted. It has no context in the saved graph.
    ghost: "aae6cd198179248b2af377980fe4f55db",
    hypothesize: "a7f1b650bcfce4837924d54b73ef238f1",
    input: "a958575cee66f4ac8a7e360411cd2677b",
    logic: "a446fd6171a764579ab5c8961a99d6f2b",
    output: "aa04a5a0714af42ac9763504b7faa21c7",
    refine: "aaa4200b9ef07435e89595b2df0684e2f",
  };

  function realRedTeam() {
    const nodes = [
      makeNode(REAL.input, "input-node"),
      makeAgentNode(REAL.hypothesize, "Hypothesize"),
      makeAgentNode(REAL.logic, "LogicCritic"),
      makeAgentNode(REAL.evidence, "EvidenceCritic"),
      makeAgentNode(REAL.feasibility, "FeasibilityCritic"),
      makeAgentNode(REAL.refine, "Refine"),
      makeAgentNode(REAL.condense, "Condense"),
      makeNode(REAL.output, "output-node"),
    ];

    const intended = [
      makeEdge(REAL.input, REAL.hypothesize),
      makeEdge(REAL.input, REAL.logic),
      makeEdge(REAL.input, REAL.evidence),
      makeEdge(REAL.input, REAL.feasibility),
      makeEdge(REAL.input, REAL.refine),
      makeEdge(REAL.input, REAL.condense),
      makeEdge(REAL.hypothesize, REAL.logic),
      makeEdge(REAL.hypothesize, REAL.evidence),
      makeEdge(REAL.hypothesize, REAL.feasibility),
      makeEdge(REAL.hypothesize, REAL.refine),
      makeEdge(REAL.logic, REAL.refine),
      makeEdge(REAL.evidence, REAL.refine),
      makeEdge(REAL.feasibility, REAL.refine),
      makeEdge(REAL.refine, REAL.condense),
      // The rewire the user made around the node they removed.
      makeEdge(REAL.condense, REAL.output),
    ];

    // Both stubs the deletion left behind.
    const orphaned = [
      makeEdge(REAL.condense, REAL.ghost),
      makeEdge(REAL.ghost, REAL.output),
    ];

    return { intended, nodes, orphaned };
  }

  it("saves the real broken team without either orphaned stub", () => {
    const { intended, nodes, orphaned } = realRedTeam();

    const [, restored] = fromApiGraph(
      toApiGraph(nodes, [...intended, ...orphaned]),
    );

    expect(asPairs(restored)).toEqual(asPairs(intended));
    expect(restored).toHaveLength(intended.length);
  });

  it("heals the real broken team on load, losing no real node or edge", () => {
    // `orphaned` is not used here: the stubs have to be composed into the AST as
    // raw EdgeAnons, since `toApiGraph` now refuses to emit them.
    const { intended, nodes } = realRedTeam();

    // As stored on chain: a graph defining eight nodes, with two edges naming a
    // ninth that has no context.
    const corrupt: Graph = {
      graph_1: {
        graph_1: toApiGraph(nodes, intended),
        graph_2: danglingEdge(REAL.condense, REAL.ghost),
        type: "Tensor",
      },
      graph_2: danglingEdge(REAL.ghost, REAL.output),
      type: "Tensor",
    };

    const [loadedNodes, loadedEdges] = fromApiGraph(corrupt);

    expect(asPairs(loadedEdges)).toEqual(asPairs(intended));
    expect(loadedNodes.map((node) => node.id).sort()).toEqual(
      nodes.map((node) => node.id).sort(),
    );

    // Saving what was loaded produces a graph with nothing dangling, which is
    // what makes the team deployable again.
    const [, resaved] = fromApiGraph(toApiGraph(loadedNodes, loadedEdges));
    expect(asPairs(resaved)).toEqual(asPairs(intended));
  });
});
