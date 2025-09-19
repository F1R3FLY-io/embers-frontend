import type { Graph, Name, Vertex } from "@f1r3fly-io/embers-client-sdk";

import type { Edge, Node } from "./components/GraphEditor";

const NIL: Graph = {
  type: "Nil",
};

type ContainerGroup = {
  container: Node;
  nodes: Node[];
};

// this should be stack safe
export function toApiGraph(nodes: Node[], edges: Edge[]): Graph {
  const groups = groupByDeployContainer(nodes);
  return {
    graph_1: buildSubgraphs(groups),
    graph_2: buildEdges(edges),
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
        graph_1: buildNodes(group.nodes),
        graph_2: acc,
        type: "Subgraph",
        var: group.container.id,
      },
      name: {
        type: "GVar",
        value: group.container.id,
      },
      string: JSON.stringify(group.container.data),
      type: "Context",
    }),
    NIL,
  );
}

function buildNodes(nodes: Node[]): Graph {
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
      string: JSON.stringify(node.data),
      type: "Context",
    };
  }, NIL);
}

function buildEdges(edges: Edge[]): Graph {
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
