import type { Graph } from "@f1r3fly-io/embers-client-sdk";

import type { Edge, Node } from "./components/GraphEditor";

const NIL = {
  type: "Nil",
} as const;

type ContainerGroup = {
  container: Node;
  nodes: Node[];
};

type NodeGroup = {
  edges: Edge[];
  node: Node;
};

export function toApiGraph(nodes: Node[], edges: Edge[]): Graph {
  const groups = groupByDeployContainer(nodes);
  return buildSubgraphs(groups, edges);
}

function groupByDeployContainer(nodes: Node[]): ContainerGroup[] {
  return nodes
    .filter((node) => node.type === "deploy-container")
    .map((container) => ({
      container,
      nodes: nodes.filter((node) => node.parentId === container.id),
    }));
}

function buildSubgraphs(groups: ContainerGroup[], edges: Edge[]): Graph {
  if (groups.length === 0) {
    return NIL;
  }

  const [head, ...tail] = groups;

  return {
    _var: head.container.id,
    graph1: buildGraph(head.nodes, edges),
    graph2: buildSubgraphs(tail, edges),
    type: "Subgraph",
  };
}

function buildGraph(nodes: Node[], edges: Edge[]): Graph {
  const groups = groupNodesWithEdges(nodes, edges);
  return buildEdges(groups);
}

function groupNodesWithEdges(nodes: Node[], edges: Edge[]): NodeGroup[] {
  return nodes.map((node) => ({
    edges: edges.filter((edge) => edge.source === node.id),
    node,
  }));
}

function buildEdges(groups: NodeGroup[]): Graph {
  if (groups.length === 0) {
    return NIL;
  }

  const [head, ...tail] = groups;

  return {
    graph1: buildEdge(head.node, head.edges),
    graph2: buildEdges(tail),
    type: "Tensor",
  };
}

function buildEdge(node: Node, edges: Edge[]): Graph {
  if (edges.length === 0) {
    return {
      graph: NIL,
      type: "Vertex",
      vertex: {
        name: {
          type: "GVar",
          value: node.id,
        },
      },
    };
  }

  const [edge, ...tail] = edges;

  return {
    binding1: {
      _var: `var_${node.id}_${tail.length}`,
      graph: buildEdge(node, tail),
      vertex: {
        name: {
          type: "VVar",
          value: node.id,
        },
      },
    },
    binding2: {
      _var: `var_${edge.source}_${edge.target}`,
      graph: {
        _var: `var_${edge.target}_0`,
        graph: NIL,
        type: "Var",
      },
      vertex: {
        name: {
          type: "VVar",
          value: edge.target,
        },
      },
    },
    type: "EdgeAnon",
  };
}
