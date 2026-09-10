import type { EdgeChange, NodeChange, ReactFlowInstance } from "@xyflow/react";
import type { ReactNode } from "react";

import type { MenuItem } from "@/lib/components/ContextMenu";
import type {
  Edge,
  Node,
  NodeData,
  NodeTypes,
} from "@/lib/components/GraphEditor/nodes";
import type { ModalOptions } from "@/lib/providers/modal/useModal";

import { makeNodeId, makeSubgraphId } from "@/lib/graph";

import type { NodeKind } from "./nodes/nodes.registry";

import { ExecutionPolicyModal } from "./ExecutionPolicyModal";
import styles from "./GraphEditor.module.scss";
import { JoinModal } from "./JoinModal";
import { EditModal } from "./nodes/EditModal";
import { NODE_REGISTRY } from "./nodes/nodes.registry";
import { TransitionModal } from "./TransitionModal";

export type ContextMenuInput = {
  x: number;
  y: number;
} & (
  | { nodes: Node[]; type: "nodesSelected" }
  | { edges: Edge[]; type: "edgesSelected" }
  | { type: "emptySpace" }
);

function defaultOutputKey(type: string, data: object): string {
  if (type === "input-node") {
    return "input";
  }
  const values = data as Record<string, unknown>;
  if (typeof values.outputKey === "string") {
    return values.outputKey;
  }
  const label = values.agentName ?? values.label;
  const name = typeof label === "string" ? label : type;
  return name
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(
      /[^a-zA-Z0-9]+(.)?/g,
      (_, c: string | undefined) => c?.toUpperCase() ?? "",
    );
}

export function createNodeChange<T extends keyof NodeTypes>(
  type: T,
  position: Node["position"],
  data: NodeData<T>,
) {
  return [
    {
      item: {
        className: styles["no-node-style"],
        data: { ...data, outputKey: defaultOutputKey(type, data) },
        id: makeNodeId(),
        position,
        type,
      },
      type: "add" as const,
    },
  ];
}

function editInputs(node: Node) {
  return node.type === "deploy-container"
    ? [{ name: "containerId", type: "string" as const }]
    : node.type === "state-scope"
      ? [
          { name: "containerId", type: "string" as const },
          { name: "childScopeId", type: "string" as const },
          {
            name: "scopeKind",
            options: [
              { label: "Compound (one initial region)", value: "compound" },
              {
                label: "Parallel (several initial regions)",
                value: "parallel",
              },
            ],
            type: "string" as const,
          },
          {
            name: "history",
            options: [
              { label: "No history", value: "none" },
              { label: "Shallow history", value: "shallow" },
              { label: "Deep history", value: "deep" },
            ],
            type: "string" as const,
          },
          { name: "initialNodeIds", type: "string" as const },
          { name: "entryActivities", type: "string" as const },
          { name: "exitActivities", type: "string" as const },
        ]
      : [
          {
            name: node.type === "agent" ? "agentName" : "label",
            type: "string" as const,
          },
          { name: "outputKey", type: "string" as const },
          ...NODE_REGISTRY[node.type].modalInputs,
        ];
}

function routeGroupIdentity(edge: Edge): string {
  return (
    edge.data?.routeGroupId ??
    `route:${edge.source}:${edge.data?.trigger ?? "completed"}`
  );
}

/** Exported for tests: the delete actions are where a node's edges can be
 * stranded, and asserting that directly needs no React Flow instance beyond a
 * minimal typed test double. */
export function buildMenuItems(
  input: ContextMenuInput,
  {
    deleteContainer,
    onEdgesChange,
    onNodesChange,
    open,
    rf,
  }: {
    deleteContainer: (container: Node) => void;
    onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
    onNodesChange: (changes: NodeChange<Node>[]) => void;
    open: (content: ReactNode, options?: ModalOptions) => void;
    rf: ReactFlowInstance<Node, Edge>;
  },
): MenuItem[] {
  switch (input.type) {
    case "nodesSelected": {
      const deployContainers = input.nodes.filter(
        (n) => n.type === "deploy-container" || n.type === "state-scope",
      );
      const parentIds = new Set(input.nodes.map((node) => node.parentId));
      const canGroupAsScope = input.nodes.length > 0 && parentIds.size === 1;
      const selectedNode =
        input.nodes.length === 1 ? input.nodes[0] : undefined;
      const selectedInputs = selectedNode ? editInputs(selectedNode) : [];

      return [
        {
          content: "Edit node",
          hidden: selectedNode === undefined || selectedInputs.length === 0,
          onClick: () => {
            const node = input.nodes[0];
            open(
              <EditModal
                initial={node.data as Record<string, string | number>}
                inputs={selectedInputs}
                title={
                  node.type === "deploy-container"
                    ? "Edit deploy container"
                    : node.type === "state-scope"
                      ? "Edit state scope"
                      : `Edit ${NODE_REGISTRY[node.type].displayName}`
                }
                onSave={(data) =>
                  onNodesChange([
                    {
                      id: node.id,
                      item: { ...node, data } as Node,
                      type: "replace",
                    },
                  ])
                }
              />,
              {
                ariaLabel: "Edit node",
                closeOnBlur: false,
                maxWidth: 620,
              },
            );
          },
          type: "text",
        },
        {
          content: "Configure execution policy",
          hidden:
            input.nodes.length !== 1 ||
            input.nodes[0].type === "input-node" ||
            input.nodes[0].type === "output-node" ||
            input.nodes[0].type === "final-node" ||
            input.nodes[0].type === "deploy-container",
          onClick: () => {
            const node = input.nodes[0];
            open(
              <ExecutionPolicyModal
                initial={node.data}
                onSave={(data) =>
                  onNodesChange([
                    {
                      id: node.id,
                      item: { ...node, data } as Node,
                      type: "replace",
                    },
                  ])
                }
              />,
              {
                ariaLabel: "Configure execution policy",
                closeOnBlur: false,
                maxWidth: 620,
              },
            );
          },
          type: "text",
        },
        {
          content: "Configure fan-in",
          hidden:
            input.nodes.length !== 1 ||
            input.nodes[0].type === "input-node" ||
            input.nodes[0].type === "deploy-container",
          onClick: () => {
            const node = input.nodes[0];
            const incomingCount = rf
              .getEdges()
              .filter(({ target }) => target === node.id).length;
            open(
              <JoinModal
                incomingCount={incomingCount}
                initial={node.data}
                onSave={(data) =>
                  onNodesChange([
                    {
                      id: node.id,
                      item: { ...node, data } as Node,
                      type: "replace",
                    },
                  ])
                }
              />,
              {
                ariaLabel: "Configure fan-in",
                closeOnBlur: false,
                maxWidth: 520,
              },
            );
          },
          type: "text",
        },
        {
          content: "Add to deploy container",
          hidden: !canGroupAsScope,
          onClick: () => {
            const commonParentId = input.nodes[0].parentId;
            const minX = Math.min(...input.nodes.map((n) => n.position.x));
            const maxX = Math.max(
              ...input.nodes.map(
                (n) => n.position.x + (n.measured?.width ?? n.width ?? 0),
              ),
            );

            const minY = Math.min(...input.nodes.map((n) => n.position.y));
            const maxY = Math.max(
              ...input.nodes.map(
                (n) => n.position.y + (n.measured?.height ?? n.height ?? 0),
              ),
            );

            const containerNodeId = makeSubgraphId();

            const subflowNode: Node = {
              className: styles["no-node-style"],
              data: { containerId: "Deployment" },
              ...(commonParentId === undefined
                ? {}
                : {
                    extent: "parent" as const,
                    parentId: commonParentId,
                  }),
              id: containerNodeId,
              position: { x: minX - 5, y: minY - 5 },
              style: {
                height: Math.max(20, maxY - minY + 10),
                width: Math.max(20, maxX - minX + 10),
              },
              type: "deploy-container",
            };

            const parentIndex =
              commonParentId === undefined
                ? -1
                : rf.getNodes().findIndex(({ id }) => id === commonParentId);

            onNodesChange([
              {
                index: parentIndex + 1,
                item: subflowNode,
                type: "add",
              },
              ...input.nodes.map((n) => ({
                id: n.id,
                item: {
                  ...n,
                  extent: "parent" as const,
                  parentId: containerNodeId,
                  position: {
                    x: n.position.x - subflowNode.position.x,
                    y: n.position.y - subflowNode.position.y,
                  },
                },
                type: "replace" as const,
              })),
            ]);
          },
          type: "text",
        },
        {
          content: "Wrap in state scope",
          hidden: !canGroupAsScope,
          onClick: () => {
            const commonParentId = input.nodes[0].parentId;
            const minX = Math.min(...input.nodes.map((n) => n.position.x));
            const maxX = Math.max(
              ...input.nodes.map(
                (n) => n.position.x + (n.measured?.width ?? n.width ?? 0),
              ),
            );

            const minY = Math.min(...input.nodes.map((n) => n.position.y));
            const maxY = Math.max(
              ...input.nodes.map(
                (n) => n.position.y + (n.measured?.height ?? n.height ?? 0),
              ),
            );

            const containerNodeId = makeSubgraphId();
            const childScopeId = `scope:${crypto.randomUUID()}`;

            const subflowNode: Node = {
              className: styles["no-node-style"],
              data: {
                childScopeId,
                containerId: "Scope",
                entryActivities: "",
                exitActivities: "",
                history: "none",
                initialNodeIds:
                  input.nodes
                    .filter(({ type }) => type === "input-node")
                    .map(({ id }) => id)
                    .join(", ") || input.nodes[0].id,
                scopeKind: "compound",
              },
              ...(commonParentId === undefined
                ? {}
                : {
                    extent: "parent" as const,
                    parentId: commonParentId,
                  }),
              id: containerNodeId,
              position: { x: minX - 5, y: minY - 5 },
              style: {
                height: Math.max(20, maxY - minY + 10),
                width: Math.max(20, maxX - minX + 10),
              },
              type: "state-scope",
            };

            const parentIndex =
              commonParentId === undefined
                ? -1
                : rf.getNodes().findIndex(({ id }) => id === commonParentId);

            onNodesChange([
              {
                index: parentIndex + 1,
                item: subflowNode,
                type: "add",
              },
              ...input.nodes.map((n) => ({
                id: n.id,
                item: {
                  ...n,
                  extent: "parent" as const,
                  parentId: containerNodeId,
                  position: {
                    x: n.position.x - subflowNode.position.x,
                    y: n.position.y - subflowNode.position.y,
                  },
                },
                type: "replace" as const,
              })),
            ]);
          },
          type: "text",
        },
        {
          content:
            deployContainers[0]?.type === "state-scope"
              ? "Unwrap state scope"
              : "Delete deploy container",
          hidden: deployContainers.length !== 1,
          onClick: () => {
            const container = deployContainers[0];
            deleteContainer(container);
          },
          type: "text",
        },
        {
          content:
            input.nodes.length > 1 ? "Delete selected nodes" : "Delete node",
          hidden: input.nodes.length === 0 || deployContainers.length !== 0,
          onClick: () => {
            // React Flow's own deletion, not hand-built `remove` changes:
            // `applyNodeChanges` drops the node and leaves its edges behind,
            // which saves a graph whose edges reference a vertex that no longer
            // exists -- and the compiler rejects that at deploy time.
            //
            // This is also the exact path `deleteKeyCode` takes, so the menu and
            // the keyboard cannot drift apart again.
            void rf.deleteElements({ nodes: input.nodes });
          },
          type: "text",
        },
      ];
    }

    case "edgesSelected": {
      return [
        {
          content: "Configure transition",
          hidden: input.edges.length !== 1,
          onClick: () => {
            const edge = input.edges[0];
            open(
              <TransitionModal
                initial={edge.data ?? {}}
                onSave={(data, label) => {
                  const updated = { ...edge, data, label };
                  const groupId = routeGroupIdentity(updated);
                  onEdgesChange(
                    rf
                      .getEdges()
                      .filter(
                        (candidate) =>
                          candidate.id === edge.id ||
                          routeGroupIdentity(candidate) === groupId,
                      )
                      .map((candidate) => ({
                        id: candidate.id,
                        item:
                          candidate.id === edge.id
                            ? updated
                            : {
                                ...candidate,
                                data: {
                                  ...candidate.data,
                                  noMatch: data.noMatch,
                                  routeMode: data.routeMode,
                                },
                              },
                        type: "replace" as const,
                      })),
                  );
                }}
              />,
              {
                ariaLabel: "Configure transition",
                closeOnBlur: false,
                maxWidth: 620,
              },
            );
          },
          type: "text",
        },
        {
          content:
            input.edges.length > 1
              ? "Delete selected connectors"
              : "Delete connector",
          onClick: () => {
            const changes: EdgeChange<Edge>[] = input.edges.map((e) => ({
              id: e.id,
              type: "remove" as const,
            }));

            onEdgesChange(changes);
          },
          type: "text",
        },
      ];
    }

    case "emptySpace": {
      return (
        (Object.keys(NODE_REGISTRY) as NodeKind[])
          // Agents are added from the sidebar, where each carries its identity;
          // a bare "Add Agent" here would create an unusable node. Palette-
          // hidden kinds (the FIPS-gated foreign-language term) are likewise
          // not offered for creation, though they stay in the registry so
          // existing nodes render.
          .filter(
            (type) => type !== "agent" && !NODE_REGISTRY[type].paletteHidden,
          )
          .map((type) => ({
            content: `Add ${NODE_REGISTRY[type].displayName}`,
            onClick: () => {
              const position = rf.screenToFlowPosition({
                x: input.x,
                y: input.y,
              });

              if (NODE_REGISTRY[type].modalInputs.length === 0) {
                onNodesChange(
                  createNodeChange(
                    type,
                    position,
                    NODE_REGISTRY[type].defaultData,
                  ),
                );
              } else {
                open(
                  <EditModal
                    initial={NODE_REGISTRY[type].defaultData}
                    inputs={NODE_REGISTRY[type].modalInputs}
                    title={`Configure ${NODE_REGISTRY[type].displayName}`}
                    onSave={(updatedData) =>
                      onNodesChange(
                        createNodeChange(type, position, updatedData),
                      )
                    }
                  />,
                  {
                    ariaLabel: `Configure ${NODE_REGISTRY[type].displayName}`,
                    closeOnBlur: true,
                    maxWidth: 520,
                  },
                );
              }
            },
            type: "text",
          }))
      );
    }
  }
}
