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
    graph_1: buildGraph(head.nodes, edges),
    graph_2: buildSubgraphs(tail, edges),
    type: "Subgraph",
    var: head.container.id,
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
    graph_1: buildEdge(head.node, head.edges),
    graph_2: buildEdges(tail),
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
    binding_1: {
      graph: buildEdge(node, tail),
      var: `var_${node.id}_${tail.length}`,
      vertex: {
        name: {
          type: "VVar",
          value: node.id,
        },
      },
    },
    binding_2: {
      graph: {
        graph: NIL,
        type: "Var",
        var: `var_${edge.target}_0`,
      },
      var: `var_${edge.source}_${edge.target}`,
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
