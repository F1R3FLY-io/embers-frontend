import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";

import { fromApiGraph, toApiGraph } from "@/lib/graph";

// Property-based coverage of the well-formedness invariant.
//
// The defect these guard against arises on inputs a fixture author does not think
// to write, because writing a malformed graph on purpose requires already suspecting
// the bug -- which is the argument for random testing (Claessen & Hughes, QuickCheck,
// doi:10.1145/351240.351266). The example-based tests in graph.test.ts pin the exact
// shapes that broke; these assert the invariant over shapes nobody chose.
//
// Deliberately dependency-free: `fast-check` is not installed, and a seeded linear
// congruential generator is enough for a property this simple. Being seeded, a
// failure is reproducible from the seed printed in the assertion message -- the
// property a random generator must have to be useful in CI.

/** Numerical Recipes LCG. Chosen for being short and well-known rather than
 *  statistically excellent; graph shape does not need a good spectral test. */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const KINDS = [
  "input-node",
  "output-node",
  "text-model",
  "tti-model",
  "tts-model",
  "compress",
] as const;

type Generated = {
  danglingCount: number;
  edges: Edge[];
  legitimate: Edge[];
  nodes: Node[];
};

/**
 * Builds a random graph, then deliberately corrupts it the way the editor used to:
 * some edges name a node that is not in the node list.
 */
function generate(next: () => number): Generated {
  const nodeCount = 1 + Math.floor(next() * 9);
  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const kind = KINDS[Math.floor(next() * KINDS.length)];
    return {
      data: {},
      id: `n${index}`,
      position: { x: 0, y: 0 },
      type: kind,
    };
  }) as unknown as Node[];

  const legitimate: Edge[] = [];
  const edgeCount = Math.floor(next() * 12);
  for (let i = 0; i < edgeCount; i++) {
    const source = `n${Math.floor(next() * nodeCount)}`;
    const target = `n${Math.floor(next() * nodeCount)}`;
    const id = `e${i}`;
    // Skip duplicates: the graph is stored as an adjacency map, so a repeated pair
    // round-trips to one edge and would fail a naive count comparison for reasons
    // unrelated to the property under test.
    if (!legitimate.some((e) => e.source === source && e.target === target)) {
      legitimate.push({ id, source, target });
    }
  }

  const danglingCount = Math.floor(next() * 4);
  const dangling: Edge[] = Array.from({ length: danglingCount }, (_, i) => {
    const real = `n${Math.floor(next() * nodeCount)}`;
    const ghost = `ghost${i}`;
    return next() < 0.5
      ? { id: `d${i}`, source: real, target: ghost }
      : { id: `d${i}`, source: ghost, target: real };
  });

  return {
    danglingCount: dangling.length,
    edges: [...legitimate, ...dangling],
    legitimate,
    nodes,
  };
}

const pairs = (edges: Edge[]) =>
  new Set(edges.map((edge) => `${edge.source}->${edge.target}`));

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 1);

// Dropping a dangling edge warns, by design -- that notification is the fix for the
// silence that made the original defect costly. Here it is expected on nearly every
// seed, so it is silenced to keep the output readable; that the warning fires at all
// is asserted separately below.
let warn: jest.SpyInstance;
beforeAll(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterAll(() => warn.mockRestore());

describe("graph round-trip properties", () => {
  it("never emits an edge naming a node it does not define", () => {
    // The invariant itself: W(s(l(G))) for arbitrary G, including ill-formed G.
    for (const seed of SEEDS) {
      const { edges, nodes } = generate(rng(seed));

      const [restoredNodes, restoredEdges] = fromApiGraph(
        toApiGraph(nodes, edges),
      );
      const defined = new Set(restoredNodes.map((node) => node.id));

      for (const edge of restoredEdges) {
        expect({ seed, ...edge, defined: defined.has(edge.source) }).toMatchObject(
          { defined: true },
        );
        expect(defined.has(edge.target)).toBe(true);
      }
    }
  });

  it("keeps every legitimate edge and drops exactly the dangling ones", () => {
    // Stronger than the invariant: the repair must be surgical, removing only what
    // is unrepresentable and nothing else.
    for (const seed of SEEDS) {
      const { edges, legitimate, nodes } = generate(rng(seed));

      const [, restored] = fromApiGraph(toApiGraph(nodes, edges));

      expect({ pairs: [...pairs(restored)].sort(), seed }).toEqual({
        pairs: [...pairs(legitimate)].sort(),
        seed,
      });
    }
  });

  it("preserves every node regardless of how corrupt the edges are", () => {
    for (const seed of SEEDS) {
      const { edges, nodes } = generate(rng(seed));

      const [restoredNodes] = fromApiGraph(toApiGraph(nodes, edges));

      expect({ ids: restoredNodes.map((n) => n.id).sort(), seed }).toEqual({
        ids: nodes.map((n) => n.id).sort(),
        seed,
      });
    }
  });

  it("is idempotent once repaired", () => {
    // s ∘ l is a fixed-point operation on well-formed graphs. Before the fix it was
    // also a fixed point on ill-formed ones, which is what made the corruption
    // permanent; the asymmetry is the whole point of the repair.
    for (const seed of SEEDS) {
      const { edges, nodes } = generate(rng(seed));

      const [nodesOnce, edgesOnce] = fromApiGraph(toApiGraph(nodes, edges));
      const [nodesTwice, edgesTwice] = fromApiGraph(
        toApiGraph(nodesOnce, edgesOnce),
      );

      expect({ pairs: [...pairs(edgesTwice)].sort(), seed }).toEqual({
        pairs: [...pairs(edgesOnce)].sort(),
        seed,
      });
      expect(nodesTwice.map((n) => n.id).sort()).toEqual(
        nodesOnce.map((n) => n.id).sort(),
      );
    }
  });

  it("announces a repair rather than performing it silently", () => {
    // A repair the author cannot see is the same failure mode as the corruption it
    // fixes: a connection they drew disappears and nothing says so.
    warn.mockClear();
    const nodes = [
      { data: {}, id: "n1", position: { x: 0, y: 0 }, type: "input-node" },
      { data: {}, id: "n2", position: { x: 0, y: 0 }, type: "output-node" },
    ] as unknown as Node[];

    fromApiGraph(
      toApiGraph(nodes, [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n1", target: "ghost" },
      ]),
    );

    expect(warn).toHaveBeenCalledTimes(1);
    const [message] = warn.mock.calls[0] as [string];
    expect(message).toContain("n1->ghost");
  });

  it("actually exercises the corrupt case across the seed range", () => {
    // A property suite that silently generated only well-formed graphs would pass
    // while testing nothing. Assert the generator does its job.
    const withDangling = SEEDS.filter(
      (seed) => generate(rng(seed)).danglingCount > 0,
    ).length;

    expect(withDangling).toBeGreaterThan(SEEDS.length / 2);
  });
});
