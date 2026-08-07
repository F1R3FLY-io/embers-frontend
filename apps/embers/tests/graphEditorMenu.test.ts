import type { ReactFlowInstance } from "@xyflow/react";

import type { ContextMenuInput } from "@/lib/components/GraphEditor/menuItems";
import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";

import { buildMenuItems } from "@/lib/components/GraphEditor/menuItems";
import { NODE_REGISTRY } from "@/lib/components/GraphEditor/nodes/nodes.registry";

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
  deletedContainers: Node[];
  edgeChanges: unknown[][];
  nodeChanges: unknown[][];
};

function harness({
  edges = [],
  nodes = [],
}: { edges?: Edge[]; nodes?: Node[] } = {}): {
  context: Parameters<typeof buildMenuItems>[1];
  recorded: Harness;
} {
  const recorded: Harness = {
    deleted: [],
    deletedContainers: [],
    edgeChanges: [],
    nodeChanges: [],
  };

  const rf = {
    // eslint-disable-next-line @typescript-eslint/require-await
    deleteElements: async (elements: { edges?: Edge[]; nodes?: Node[] }) => {
      recorded.deleted.push(elements);
      return { deletedEdges: [], deletedNodes: [] };
    },
    getEdges: () => edges,
    getNodes: () => nodes,
  } as unknown as ReactFlowInstance<Node, Edge>;

  return {
    context: {
      deleteContainer: (container) =>
        recorded.deletedContainers.push(container),
      onEdgesChange: (changes) => recorded.edgeChanges.push(changes),
      onNodesChange: (changes) => recorded.nodeChanges.push(changes),
      open: () => undefined,
      rf,
    },
    recorded,
  };
}

function deleteNodeItem(
  nodes: Node[],
  context: Parameters<typeof buildMenuItems>[1],
) {
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

  it("routes container deletion through the graph-level transaction", () => {
    const { context, recorded } = harness();
    const container = makeNode("C1", "deploy-container");
    const item = buildMenuItems(
      {
        nodes: [container],
        type: "nodesSelected",
        x: 0,
        y: 0,
      },
      context,
    ).find((candidate) => candidate.content === "Delete deploy container");

    if (!item) {
      throw new Error("no delete-container menu item was offered");
    }
    item.onClick();

    expect(recorded.deletedContainers).toEqual([container]);
    expect(recorded.nodeChanges).toEqual([]);
    expect(recorded.edgeChanges).toEqual([]);
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

  it("wraps siblings inside an existing scope without flattening hierarchy", () => {
    const parent = makeNode("parent", "deploy-container");
    const first = {
      ...makeNode("first", "compress"),
      measured: { height: 40, width: 80 },
      parentId: parent.id,
      position: { x: 20, y: 30 },
    } as Node;
    const second = {
      ...makeNode("second", "output-node"),
      measured: { height: 40, width: 80 },
      parentId: parent.id,
      position: { x: 160, y: 90 },
    } as Node;
    const { context, recorded } = harness({ nodes: [parent, first, second] });
    const item = buildMenuItems(
      {
        nodes: [first, second],
        type: "nodesSelected",
        x: 0,
        y: 0,
      },
      context,
    ).find((candidate) => candidate.content === "Wrap in state scope");

    expect(item?.hidden).toBe(false);
    item?.onClick();

    const changes = recorded.nodeChanges[0] as {
      id?: string;
      item: Node;
      type: string;
    }[];
    const addition = changes.find(({ type }) => type === "add");
    expect(addition?.item).toMatchObject({
      extent: "parent",
      parentId: "parent",
      type: "deploy-container",
    });
    expect(addition?.item.data.childScopeId).not.toBe(addition?.item.id);
    expect(
      changes
        .filter(({ type }) => type === "replace")
        .map(({ item }) => item.parentId),
    ).toEqual([addition?.item.id, addition?.item.id]);
  });

  it("does not offer one scope wrapper for nodes with different parents", () => {
    const left = { ...makeNode("left", "compress"), parentId: "scope-a" };
    const right = { ...makeNode("right", "compress"), parentId: "scope-b" };
    const { context } = harness();
    const item = buildMenuItems(
      { nodes: [left, right] as Node[], type: "nodesSelected", x: 0, y: 0 },
      context,
    ).find((candidate) => candidate.content === "Wrap in state scope");

    expect(item?.hidden).toBe(true);
  });
});

describe("the empty-space add-node menu", () => {
  it("does not offer palette-hidden kinds while keeping them in the registry", () => {
    const { context } = harness();
    const items = buildMenuItems({ type: "emptySpace", x: 0, y: 0 }, context);
    const labels = items.map((item) => item.content);

    // The FIPS-gated foreign-language term is hidden from creation...
    expect(labels).not.toContain("Add Foreign-language term");
    // ...but stays in the registry so existing FLT nodes still render.
    expect(NODE_REGISTRY["foreign-term"]).toBeDefined();
    expect(NODE_REGISTRY["foreign-term"].paletteHidden).toBe(true);

    // A normal kind is still offered, so the menu itself is intact.
    expect(labels).toContain("Add Gateway");
    // The generic agent kind is never offered here either.
    expect(labels).not.toContain("Add Agent");
  });
});
