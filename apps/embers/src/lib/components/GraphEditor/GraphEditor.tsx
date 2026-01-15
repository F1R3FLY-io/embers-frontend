import type {
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowInstance,
  ReactFlowJsonObject,
} from "@xyflow/react";
import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  SetStateAction,
} from "react";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";

import type { MenuItem } from "@/lib/components/ContextMenu";
import type {
  Edge,
  Node,
  NodeData,
  NodeTypes,
} from "@/lib/components/GraphEditor/nodes";
import type { ModalOptions } from "@/lib/providers/modal/useModal";

import { ContextMenu } from "@/lib/components/ContextMenu";
import { nodeTypes } from "@/lib/components/GraphEditor/nodes";
import { makeNodeId, makeSubgraphId } from "@/lib/graph";
import { useModal } from "@/lib/providers/modal/useModal";

import type { NodeKind } from "./nodes/nodes.registry";

import styles from "./GraphEditor.module.scss";
import { EditModal } from "./nodes/EditModal";
import { NODE_REGISTRY } from "./nodes/nodes.registry";

type GraphEditorProps = {
  edges: Edge[];
  initialViewport?: ReactFlowJsonObject<Node, Edge>["viewport"] | undefined;
  nodes: Node[];
  onFlowChange?: (flow: ReactFlowJsonObject<Node, Edge>) => void;
  onGraphChange?: () => void;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setNodes: Dispatch<SetStateAction<Node[]>>;
};

export function GraphEditor({
  edges,
  initialViewport,
  nodes,
  onFlowChange,
  onGraphChange,
  setEdges,
  setNodes,
}: GraphEditorProps) {
  const { open } = useModal();
  const rf = useReactFlow<Node, Edge>();

  const handleInit = useCallback(() => {
    if (initialViewport) {
      void rf.setViewport(initialViewport);
    }

    queueMicrotask(() => {
      if (onFlowChange) {
        onFlowChange(rf.toObject());
      }
    });
  }, [initialViewport, onFlowChange, rf]);

  const emitFlow = useCallback(() => {
    if (!onFlowChange) {
      return;
    }
    onFlowChange(rf.toObject());
  }, [onFlowChange, rf]);

  const notifyGraphChange = useCallback(() => {
    if (onGraphChange) {
      onGraphChange();
    }
  }, [onGraphChange]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes((nodesSnapshot) => {
        const next = applyNodeChanges(changes, nodesSnapshot);
        queueMicrotask(emitFlow);
        return next;
      });
    },
    [setNodes, emitFlow],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((edgesSnapshot) => {
        const next = applyEdgeChanges(changes, edgesSnapshot);
        queueMicrotask(emitFlow);
        return next;
      });
    },
    [setEdges, emitFlow],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((edgesSnapshot) => {
        const next = addEdge(connection, edgesSnapshot);
        queueMicrotask(emitFlow);
        queueMicrotask(notifyGraphChange);
        return next;
      });
    },
    [setEdges, emitFlow, notifyGraphChange],
  );

  const {
    closeContextMenu,
    contextMenuInput,
    openEdgeContextMenu,
    openEmptySpaceContextMenu,
    openNodeContextMenu,
    openSelectionContextMenu,
  } = useContextMenu();

  const menuItems = useMemo(
    () =>
      contextMenuInput !== undefined
        ? buildMenuItems(contextMenuInput, {
            nodes,
            notifyGraphChange,
            onEdgesChange,
            onNodesChange,
            open,
            rf,
          })
        : [],
    [
      contextMenuInput,
      nodes,
      notifyGraphChange,
      onEdgesChange,
      onNodesChange,
      open,
      rf,
    ],
  );

  return (
    <div className={styles.container}>
      <ReactFlow
        fitView
        defaultEdgeOptions={{
          animated: true,
          className: styles.edge,
          selectable: true,
        }}
        deleteKeyCode={["Delete", "Backspace"]}
        edges={edges}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          notifyGraphChange();
          const type = event.dataTransfer.getData(
            "application/reactflow",
          ) as NodeKind;

          if (!(type in NODE_REGISTRY)) {
            return;
          }

          let offsetX = 0;
          let offsetY = 0;

          const rawOffset = event.dataTransfer.getData(
            "application/reactflow-offset",
          );
          if (rawOffset) {
            try {
              const parsed = JSON.parse(rawOffset) as {
                x?: number;
                y?: number;
              };
              offsetX = parsed.x ?? 0;
              offsetY = parsed.y ?? 0;
            } catch {
              offsetX = 0;
              offsetY = 0;
            }
          }

          const position = rf.screenToFlowPosition({
            x: event.clientX - offsetX,
            y: event.clientY - offsetY,
          });

          if (NODE_REGISTRY[type].modalInputs.length === 0) {
            onNodesChange(
              createNodeChange(type, position, NODE_REGISTRY[type].defaultData),
            );
          } else {
            open(
              <EditModal
                initial={NODE_REGISTRY[type].defaultData}
                inputs={NODE_REGISTRY[type].modalInputs}
                onSave={(updatedData) => {
                  onNodesChange(createNodeChange(type, position, updatedData));
                }}
              />,
              {
                ariaLabel: `Configure ${NODE_REGISTRY[type].displayName}`,
                closeOnBlur: true,
                maxWidth: 520,
              },
            );
          }
        }}
        onEdgeContextMenu={openEdgeContextMenu}
        onEdgesChange={onEdgesChange}
        onInit={handleInit}
        onMoveEnd={() => emitFlow()}
        onNodeContextMenu={openNodeContextMenu}
        onNodeDragStop={() => notifyGraphChange()}
        onNodesChange={onNodesChange}
        onPaneContextMenu={openEmptySpaceContextMenu}
        onSelectionContextMenu={openSelectionContextMenu}
      >
        <Background
          className={styles.background}
          gap={5}
          patternClassName={styles.pattern}
        />
        <Controls />
        <ContextMenu
          items={menuItems}
          open={contextMenuInput !== undefined}
          position={{
            x: contextMenuInput?.x ?? 0,
            y: contextMenuInput?.y ?? 0,
          }}
          onClose={closeContextMenu}
        />
      </ReactFlow>
    </div>
  );
}

function createNodeChange<T extends keyof NodeTypes>(
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

type ContextMenuInput = {
  x: number;
  y: number;
} & (
  | { nodes: Node[]; type: "nodesSelected" }
  | { edges: Edge[]; type: "edgesSelected" }
  | { type: "emptySpace" }
);

function useContextMenu() {
  const [contextMenuInput, setContextMenuInput] = useState<ContextMenuInput>();
  const openSelectionContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent, selected: Node[]) => {
      event.stopPropagation();
      event.preventDefault();
      setContextMenuInput({
        nodes: selected,
        type: "nodesSelected",
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const openNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      event.stopPropagation();
      event.preventDefault();
      setContextMenuInput({
        nodes: [node],
        type: "nodesSelected",
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const openEdgeContextMenu = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      event.stopPropagation();
      event.preventDefault();
      setContextMenuInput({
        edges: [edge],
        type: "edgesSelected",
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const openEmptySpaceContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      setContextMenuInput({
        type: "emptySpace",
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenuInput(undefined);
  }, []);

  return {
    closeContextMenu,
    contextMenuInput,
    openEdgeContextMenu,
    openEmptySpaceContextMenu,
    openNodeContextMenu,
    openSelectionContextMenu,
  };
}

function buildMenuItems(
  input: ContextMenuInput,
  {
    nodes,
    notifyGraphChange,
    onEdgesChange,
    onNodesChange,
    open,
    rf,
  }: {
    nodes: Node[];
    notifyGraphChange: () => void;
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
            notifyGraphChange();
            onNodesChange(changes);
          },
          type: "text",
        },
        {
          content:
            input.nodes.length > 1 ? "Delete selected nodes" : "Delete node",
          hidden: input.nodes.length === 0 || deployContainers.length !== 0,
          onClick: () => {
            const changes: NodeChange<Node>[] = input.nodes.map((node) => ({
              id: node.id,
              type: "remove" as const,
            }));

            notifyGraphChange();
            onNodesChange(changes);
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

            notifyGraphChange();
            onEdgesChange(changes);
          },
          type: "text",
        },
      ];
    }

    case "emptySpace": {
      return (Object.keys(NODE_REGISTRY) as NodeKind[]).map((type) => ({
        content: `Add ${NODE_REGISTRY[type].displayName}`,
        onClick: () => {
          const position = rf.screenToFlowPosition({
            x: input.x,
            y: input.y,
          });

          if (NODE_REGISTRY[type].modalInputs.length === 0) {
            onNodesChange(
              createNodeChange(type, position, NODE_REGISTRY[type].defaultData),
            );
            notifyGraphChange();
          } else {
            open(
              <EditModal
                initial={NODE_REGISTRY[type].defaultData}
                inputs={NODE_REGISTRY[type].modalInputs}
                onSave={(updatedData) => {
                  notifyGraphChange();
                  onNodesChange(createNodeChange(type, position, updatedData));
                }}
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
      }));
    }
  }
}
