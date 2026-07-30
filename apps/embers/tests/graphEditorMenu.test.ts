import type { ReactFlowInstance } from "@xyflow/react";

import type { ContextMenuInput } from "@/lib/components/GraphEditor/menuItems";
import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";

import { buildMenuItems } from "@/lib/components/GraphEditor/menuItems";

// Guards the deletion path itself. graph.test.ts covers the persistence side --
// that a dangling edge is neither written nor read back -- but those guards would
// happily mask a regression here: a node deleted without its edges would produce
// a graph that still saves cleanly, and the defect would only reappear if the
// filters were ever relaxed. This asserts the cause, not just the symptom.
//
// The bug: the menu built `remove` node changes by hand and passed them to
// `onNodesChange`, which applies `applyNodeChanges` and leaves edges untouched.
// Only React Flow's `deleteElements` removes a node's edges with it, and that is
// what the Delete/Backspace key already used.

function makeNode(id: string, type: Node["type"]): Node {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return { data: {}, id, position: { x: 0, y: 0 }, type } as any;
}

type Harness = {
  deleted: { edges?: Edge[]; nodes?: Node[] }[];
  edgeChanges: unknown[][];
  nodeChanges: unknown[][];
};

function harness(): {
  context: Parameters<typeof buildMenuItems>[1];
  recorded: Harness;
} {
  const recorded: Harness = { deleted: [], edgeChanges: [], nodeChanges: [] };

  const rf = {
    // eslint-disable-next-line @typescript-eslint/require-await
    deleteElements: async (elements: { edges?: Edge[]; nodes?: Node[] }) => {
      recorded.deleted.push(elements);
      return { deletedEdges: [], deletedNodes: [] };
    },
  } as unknown as ReactFlowInstance<Node, Edge>;

  return {
    context: {
      nodes: [],
      onEdgesChange: (changes) => recorded.edgeChanges.push(changes),
      onNodesChange: (changes) => recorded.nodeChanges.push(changes),
      open: () => undefined,
      rf,
    },
    recorded,
  };
}

function deleteNodeItem(nodes: Node[], context: Parameters<typeof buildMenuItems>[1]) {
  const input: ContextMenuInput = { nodes, type: "nodesSelected", x: 0, y: 0 };
  const items = buildMenuItems(input, context);

  const item = items.find(
    (candidate) =>
      candidate.content === "Delete node" ||
      candidate.content === "Delete selected nodes",
  );
  if (!item) {
    throw new Error("no delete-node menu item was offered");
  }
  return item;
}

describe("the delete-node menu action", () => {
  it("deletes through React Flow, so a node's edges go with it", () => {
    const { context, recorded } = harness();
    const nodes = [makeNode("n1", "compress")];

    deleteNodeItem(nodes, context).onClick();

    expect(recorded.deleted).toEqual([{ nodes }]);
  });

  it("never hand-rolls a bare node removal", () => {
    // The exact regression: `onNodesChange([{ id, type: "remove" }])` removes the
    // node and strands its edges. If this ever fires again, the graph corrupts.
    const { context, recorded } = harness();

    deleteNodeItem([makeNode("n1", "compress")], context).onClick();

    const removals = recorded.nodeChanges
      .flat()
      .filter((change) => (change as { type?: string }).type === "remove");
    expect(removals).toEqual([]);
  });

  it("passes every selected node in one call", () => {
    const { context, recorded } = harness();
    const nodes = [
      makeNode("n1", "compress"),
      makeNode("n2", "text-model"),
      makeNode("n3", "output-node"),
    ];

    deleteNodeItem(nodes, context).onClick();

    expect(recorded.deleted).toHaveLength(1);
    expect(recorded.deleted[0].nodes?.map((node) => node.id)).toEqual([
      "n1",
      "n2",
      "n3",
    ]);
  });

  it("offers the action for a plain selection and hides it for a container", () => {
    const { context } = harness();
    const input: ContextMenuInput = {
      nodes: [makeNode("n1", "compress")],
      type: "nodesSelected",
      x: 0,
      y: 0,
    };

    const plain = buildMenuItems(input, context).find(
      (item) => item.content === "Delete node",
    );
    expect(plain?.hidden).toBe(false);

    // A deploy container has its own delete action, which re-parents children.
    const withContainer = buildMenuItems(
      {
        nodes: [makeNode("C1", "deploy-container")],
        type: "nodesSelected",
        x: 0,
        y: 0,
      },
      context,
    ).find((item) => item.content === "Delete node");
    expect(withContainer?.hidden).toBe(true);
  });

  it("still removes a selected connector through edge changes", () => {
    // Deleting an edge strands nothing, so that path is unchanged and must stay
    // working.
    const { context, recorded } = harness();
    const edges: Edge[] = [{ id: "e1", source: "n1", target: "n2" }];

    const items = buildMenuItems(
      { edges, type: "edgesSelected", x: 0, y: 0 },
      context,
    );
    const item = items.find(
      (candidate) =>
        candidate.content === "Delete connector" ||
        candidate.content === "Delete selected connectors",
    );
    if (!item) {
      throw new Error("no delete-connector menu item was offered");
    }
    item.onClick();

    expect(recorded.edgeChanges.flat()).toEqual([{ id: "e1", type: "remove" }]);
    expect(recorded.deleted).toEqual([]);
  });
});
