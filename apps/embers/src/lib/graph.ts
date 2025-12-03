import type { Graph, Name, Vertex } from "@f1r3fly-io/embers-client-sdk";

import dagre from "dagre";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";

import styles from "@/lib/components/GraphEditor/GraphEditor.module.scss";

const NIL: Graph = {
  type: "Nil",
};

type ContainerGroup = {
  container: Node;
  nodes: Node[];
};

type DagreNodeLabel = {
  height: number;
  width: number;
};

const DAGRE_NODE_WIDTH = 320;
const DAGRE_NODE_HEIGHT = 140;

// this should be stack safe
export function toApiGraph(nodes: Node[], edges: Edge[]): Graph {
  const groups = groupByDeployContainer(nodes);
  return {
    graph_1: buildSubgraphs(groups),
    graph_2: buildGraphEdges(edges),
    type: "Tensor",
  };
}

function groupByDeployContainer(nodes: Node[]): ContainerGroup[] {
  return nodes
    .filter((node) => node.type === "deploy-container")
    .map((container) => ({
      container,
      nodes: nodes.filter((node) => node.parentId === container.id),
    }));
}

function buildSubgraphs(groups: ContainerGroup[]): Graph {
  return groups.reduceRight(
    (acc, group): Graph => ({
      graph: {
        graph_1: buildGraphNodes(group.nodes),
        graph_2: acc,
        type: "Subgraph",
        var: group.container.id,
      },
      name: {
        type: "GVar",
        value: group.container.id,
      },
      string: buildNodeContext(group.container),
      type: "Context",
    }),
    NIL,
  );
}

function buildGraphNodes(nodes: Node[]): Graph {
  return nodes.reduceRight((acc, node): Graph => {
    const name: Name = {
      type: "VVar",
      value: node.id,
    };

    const vertex: Vertex = {
      name,
    };

    return {
      graph: {
        graph: {
          graph: acc,
          type: "Vertex",
          vertex,
        },
        type: "Nominate",
        var: node.id,
        vertex,
      },
      name,
      string: buildNodeContext(node),
      type: "Context",
    };
  }, NIL);
}

function buildGraphEdges(edges: Edge[]): Graph {
  return edges.reduceRight(
    (acc, edge): Graph => ({
      graph_1: {
        binding_1: {
          graph: NIL,
          var: edge.source,
          vertex: {
            name: {
              type: "VVar",
              value: edge.source,
            },
          },
        },
        binding_2: {
          graph: NIL,
          var: edge.target,
          vertex: {
            name: {
              type: "VVar",
              value: edge.target,
            },
          },
        },
        type: "EdgeAnon",
      },
      graph_2: acc,
      type: "Tensor",
    }),
    NIL,
  );
}

function buildNodeContext(node: Node) {
  switch (node.type) {
    case "compress": {
      return JSON.stringify({ type: "compress" });
    }
    case "input-node": {
      return JSON.stringify({ type: "input-node" });
    }
    case "output-node": {
      return JSON.stringify({ type: "output-node" });
    }
    case "text-model": {
      return JSON.stringify({ type: "text-model" });
    }
    case "tti-model": {
      return JSON.stringify({ type: "tti-model" });
    }
    case "tts-model": {
      return JSON.stringify({ type: "tts-model" });
    }
    case "deploy-container": {
      return JSON.stringify({ type: "deploy-container" });
    }
  }
}

type FlatGraph = {
  contexts: Map<string, string>;
  currentSubgraph: string | null;
  edges: Map<string, Set<string>>;
  nodeToParent: Map<string, string>;
  vertexes: Set<string>;
};

export function fromApiGraph(graph: Graph): [Node[], Edge[]] {
  const context = collectGraphParts(graph, {
    contexts: new Map(),
    currentSubgraph: null,
    edges: new Map(),
    nodeToParent: new Map(),
    vertexes: new Set(),
  });

  const nodes = buildNodes(context);
  const edges = buildEdges(context);

  return [nodes, edges];
}

function collectGraphParts(graph: Graph, context: FlatGraph): FlatGraph {
  const toVisit = [graph];

  while (toVisit.length !== 0) {
    const graph = toVisit.pop()!;

    switch (graph.type) {
      case "Nil": {
        break;
      }
      case "Var": {
        toVisit.push(graph.graph);
        break;
      }
      case "Nominate":
      case "Vertex": {
        toVisit.push(graph.graph);
        const name = nameToString(graph.vertex.name);
        context.vertexes.add(name);
        if (context.currentSubgraph !== null) {
          context.nodeToParent.set(name, context.currentSubgraph);
        }
        break;
      }
      case "EdgeAnon":
      case "EdgeNamed": {
        toVisit.push(graph.binding_1.graph);
        toVisit.push(graph.binding_2.graph);

        const edge = context.edges.get(graph.binding_1.var);
        if (edge === undefined) {
          context.edges.set(
            graph.binding_1.var,
            new Set([graph.binding_2.var]),
          );
        } else {
          edge.add(graph.binding_2.var);
        }

        break;
      }
      case "Subgraph": {
        collectGraphParts(graph.graph_1, {
          ...context,
          currentSubgraph: graph.var,
        });
        toVisit.push(graph.graph_2);
        context.vertexes.add(graph.var);
        break;
      }
      case "Tensor": {
        toVisit.push(graph.graph_1);
        toVisit.push(graph.graph_2);
        break;
      }
      case "Context": {
        toVisit.push(graph.graph);
        context.contexts.set(nameToString(graph.name), graph.string);
        break;
      }
      case "RuleAnon":
      case "RuleNamed": {
        throw new Error(`unsupported graph type: ${graph.type}`);
      }
    }
  }

  return context;
}

function nameToString(name: Name): string {
  switch (name.type) {
    case "VVar":
    case "GVar":
      return name.value;
    case "Wildcard":
    case "QuoteGraph":
    case "QuoteVertex":
      throw new Error(`unsupported name type: ${name.type}`);
  }
}

function buildEdges(flatGraph: FlatGraph): Edge[] {
  return [...flatGraph.edges]
    .flatMap(([source, targets]) =>
      [...targets].map((target) => [source, target]),
    )
    .map(([source, target]) => ({
      id: crypto.randomUUID(),
      source,
      target,
    }));
}

function buildNodes(flatGraph: FlatGraph): Node[] {
  return [...flatGraph.vertexes]
    .map((vertex) => {
      const contextString = flatGraph.contexts.get(vertex);

      if (contextString === undefined) {
        throw new Error(`vertex ${vertex} is missing context`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const context = JSON.parse(contextString);

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: context,
        id: vertex,
        parentId: flatGraph.nodeToParent.get(vertex),
        position: {
          x: 0,
          y: 0,
        }, // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        type: context.type,
      } as Node;
    })
    .sort((l, _) => (l.type === "deploy-container" ? -1 : 1));
}

export function makeNodeId() {
  // VVar in graphl
  return `a${crypto.randomUUID().replace(/-/g, "")}`;
}

export function makeSubgraphId() {
  // GVar in graphl
  return `A${crypto.randomUUID().replace(/-/g, "")}`;
}

function layoutWithDagre(
  nodes: Node[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR",
): {
  edges: Edge[];
  nodes: Node[];
} {
  const g = new dagre.graphlib.Graph<DagreNodeLabel>();

  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    nodesep: 60,
    rankdir: direction,
    ranksep: 50
  });

  nodes.forEach((node) => {
    if (node.type === "deploy-container") {
      return;
    }

    g.setNode(node.id, {
      height: DAGRE_NODE_HEIGHT,
      width: DAGRE_NODE_WIDTH,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes: Node[] = nodes.map((node) => {
    if (node.type === "deploy-container") {
      return node;
    }

    const dagreNode = g.node(node.id);

    const { height, width, x, y } = dagreNode;

    return {
      ...node,
      position: {
        x: x - width / 2,
        y: y - height / 2,
      },
    };
  });

  return { edges, nodes: layoutedNodes };
}

type NodeWithParent = Node & {
  extent?: "parent" | "root";
  parentId?: string;
};

function normalizeGraphNodes(nodes: Node[]): Node[] {
  return nodes.map((node) => {
    if (node.type === "deploy-container") {
      return {
        ...node,
        className: styles["no-node-style"],
        data: { containerId: "default" },
      };
    }

    const n = node as NodeWithParent;

    if (n.parentId) {
      return {
        ...n,
        extent: "parent",
      };
    }

    return node;
  });
}

export function resizeContainers(nodes: Node[]): Node[] {
  const clone = nodes.map((n) => ({ ...n })) as NodeWithParent[];

  const byId = new Map<string, NodeWithParent>();
  clone.forEach((n) => byId.set(n.id, n));

  const childrenByParent = new Map<string, NodeWithParent[]>();

  clone.forEach((node) => {
    if (!node.parentId) {
      return;
    }
    if (!childrenByParent.has(node.parentId)) {
      childrenByParent.set(node.parentId, []);
    }
    childrenByParent.get(node.parentId)!.push(node);
  });

  for (const [parentId, children] of childrenByParent.entries()) {
    const parent = byId.get(parentId);
    if (!parent || parent.type !== "deploy-container") {
      continue;
    }
    if (!children.length) {
      continue;
    }

    const xs = children.map((c) => c.position.x);
    const ys = children.map((c) => c.position.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const padding = 24;

    const parentX = minX - padding;
    const parentY = minY - padding;

    parent.position = { x: parentX, y: parentY };
    parent.style = {
      ...(parent.style ?? {}),
      height: maxY - minY + DAGRE_NODE_HEIGHT,
      width: maxX - minX + DAGRE_NODE_WIDTH,
    };

    children.forEach((child) => {
      child.position = {
        x: child.position.x - parentX,
        y: child.position.y - parentY,
      };
    });
  }

  return clone;
}

export function layoutAndNormalizeFromApi(ast: Graph): [Node[], Edge[]] {
  const [rawNodes, rawEdges] = fromApiGraph(ast);

  const { edges: dagreEdges, nodes: dagreNodes } = layoutWithDagre(
    rawNodes,
    rawEdges,
    "LR",
  );

  const normalized = normalizeGraphNodes(dagreNodes);
  const resized = resizeContainers(normalized);

  return [resized, dagreEdges];
}
