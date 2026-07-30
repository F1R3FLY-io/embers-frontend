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

import styles from "./GraphEditor.module.scss";
import { EditModal } from "./nodes/EditModal";
import { NODE_REGISTRY } from "./nodes/nodes.registry";

export type ContextMenuInput = {
  x: number;
  y: number;
} & (
  | { nodes: Node[]; type: "nodesSelected" }
  | { edges: Edge[]; type: "edgesSelected" }
  | { type: "emptySpace" }
);

export function createNodeChange<T extends keyof NodeTypes>(
  type: T,
  position: Node["position"],
  data: NodeData<T>,
) {
  return [
    {
      item: {
        className: styles["no-node-style"],
        data,
        id: makeNodeId(),
        position,
        type,
      },
      type: "add" as const,
    },
  ];
}

/** Exported for tests: the delete actions are where a node's edges can be
 * stranded, and asserting that directly needs no React Flow instance beyond a
 * stub. */
export function buildMenuItems(
  input: ContextMenuInput,
  {
    nodes,
    onEdgesChange,
    onNodesChange,
    open,
    rf,
  }: {
    nodes: Node[];
    onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
    onNodesChange: (changes: NodeChange<Node>[]) => void;
    open: (content: ReactNode, options?: ModalOptions) => void;
    rf: ReactFlowInstance<Node, Edge>;
  },
): MenuItem[] {
  switch (input.type) {
    case "nodesSelected": {
      const deployContainers = input.nodes.filter(
        (n) => n.type === "deploy-container",
      );

      return [
        {
          content: "Add to deploy container",
          hidden:
            deployContainers.length !== 0 ||
            input.nodes.some((n) => !!n.parentId),
          onClick: () => {
            const minX = Math.min(...input.nodes.map((n) => n.position.x));
            const maxX = Math.max(
              ...input.nodes.map(
                (n) => n.position.x + (n.measured!.width ?? 0),
              ),
            );

            const minY = Math.min(...input.nodes.map((n) => n.position.y));
            const maxY = Math.max(
              ...input.nodes.map(
                (n) => n.position.y + (n.measured!.height ?? 0),
              ),
            );

            const parentId = makeSubgraphId();

            const subflowNode: Node = {
              className: styles["no-node-style"],
              data: { containerId: "default" },
              id: parentId,
              position: { x: minX - 5, y: minY - 5 },
              style: { height: maxY - minY + 10, width: maxX - minX + 10 },
              type: "deploy-container",
            };

            onNodesChange([
              { index: 0, item: subflowNode, type: "add" },
              ...input.nodes.map((n) => ({
                id: n.id,
                item: {
                  ...n,
                  extent: "parent" as const,
                  parentId,
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
          content: "Delete deploy container",
          hidden: deployContainers.length !== 1,
          onClick: () => {
            const container = deployContainers[0];

            const children = nodes.filter((n) => n.parentId === container.id);

            const changes: NodeChange<Node>[] = [
              ...children.map((child) => {
                const { extent: _extent, parentId: _parentId, ...rest } = child;

                return {
                  id: child.id,
                  item: {
                    ...rest,
                    position: {
                      x: container.position.x + child.position.x,
                      y: container.position.y + child.position.y,
                    },
                  },
                  type: "replace" as const,
                };
              }),
              { id: container.id, type: "remove" as const },
            ];
            onNodesChange(changes);
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
          // a bare "Add Agent" here would create an unusable node.
          .filter((type) => type !== "agent")
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
