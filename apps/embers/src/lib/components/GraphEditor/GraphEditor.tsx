import type { Connection, Edge as REdge, Node as RNode } from "@xyflow/react";
import type { MouseEvent as ReactMouseEvent } from "react";

import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";

import type { MenuItem } from "@/lib/components/ContextMenu";
import type { NodeTypes } from "@/lib/components/GraphEditor/nodes";

import { ContextMenu } from "@/lib/components/ContextMenu";
import { nodeTypes } from "@/lib/components/GraphEditor/nodes";
import { useModal } from "@/lib/providers/modal/useModal";

import type { NodeKind } from "./nodes/nodes.registry";

import styles from "./GraphEditor.module.scss";
import { MODAL_REGISTRY, NODE_REGISTRY } from "./nodes/nodes.registry";

export type Node = {
  [K in keyof NodeTypes]: RNode<Parameters<NodeTypes[K]>[0]["data"], K>;
}[keyof NodeTypes];

export type Edge = REdge;
export type NodeData<T extends keyof NodeTypes> = Extract<
  Node,
  { type: T }
>["data"];

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
        id: crypto.randomUUID(),
        position,
        type,
      },
      type: "add" as const,
    },
  ];
}

export function GraphEditor() {
  const [nodes, , onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { open } = useModal();

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((edgesSnapshot) => addEdge(connection, edgesSnapshot)),
    [setEdges],
  );

  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  const openContextMenu = useCallback((event: ReactMouseEvent | MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuOpen(true);
  }, []);

  const openSelectionContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent, selected: Node[]) => {
      setSelectedNodes(selected);
      openContextMenu(event);
    },
    [openContextMenu],
  );

  const closeContextMenu = useCallback(() => {
    setSelectedNodes([]);
    setContextMenuOpen(false);
  }, []);

  const { screenToFlowPosition } = useReactFlow();

  const addItems = useMemo<MenuItem[]>(() => {
    return (Object.keys(NODE_REGISTRY) as NodeKind[]).map((type) => ({
      content: `Add ${NODE_REGISTRY[type].displayName}`,
      hidden: selectedNodes.length !== 0,
      onClick: () => {
        const pos = screenToFlowPosition(contextMenuPosition);
        const data = NODE_REGISTRY[type].defaultData;
        const ModalComponent = MODAL_REGISTRY[type];
        open(
          <ModalComponent
            initial={data}
            onSave={(updatedData) => {
              onNodesChange(createNodeChange(type, pos, updatedData));
            }}
          />,
          {
            ariaLabel: `Configure ${NODE_REGISTRY[type].displayName}`,
            closeOnBlur: true,
            maxWidth: 520,
          },
        );
      },
      type: "text",
    }));
  }, [
    contextMenuPosition,
    onNodesChange,
    open,
    screenToFlowPosition,
    selectedNodes.length,
  ]);

  const deployItem: MenuItem = useMemo(
    () => ({
      content: "Add to deploy container",
      hidden: selectedNodes.length === 0,
      onClick: () => {
        const minX = Math.min(...selectedNodes.map((n) => n.position.x));
        const maxX = Math.max(
          ...selectedNodes.map((n) => n.position.x + (n.measured!.width ?? 0)),
        );

        const minY = Math.min(...selectedNodes.map((n) => n.position.y));
        const maxY = Math.max(
          ...selectedNodes.map((n) => n.position.y + (n.measured!.height ?? 0)),
        );

        const parentId = crypto.randomUUID();

        const subflowNode: Node = {
          className: styles["no-node-style"],
          data: { containerId: "default" },
          id: parentId,
          position: { x: minX - 5, y: minY - 5 },
          style: { height: maxY - minY + 10, width: maxX - minX + 10 },
          type: "deploy-container",
        };

        onNodesChange([
          // parent should come before children
          { index: 0, item: subflowNode, type: "add" },
          ...selectedNodes.map((n) => ({
            id: n.id,
            item: {
              ...n,
              extent: "parent" as const,
              parentId,
              // position should be relative to parent
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
    }),
    [onNodesChange, selectedNodes],
  );

  const menuItems = useMemo<MenuItem[]>(
    () => [...addItems, deployItem],
    [addItems, deployItem],
  );

  return (
    <div className={styles.container}>
      <ReactFlow
        fitView
        defaultEdgeOptions={{ animated: true, className: styles.edge }}
        deleteKeyCode={["Delete", "Backspace"]}
        edges={edges}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const type = event.dataTransfer.getData(
            "application/reactflow",
          ) as NodeKind;

          if (type in NODE_REGISTRY) {
            const position = screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            });

            const data = NODE_REGISTRY[type].defaultData;
            const ModalComponent = MODAL_REGISTRY[type];
            open(
              <ModalComponent
                initial={data}
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
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onPaneContextMenu={openContextMenu}
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
          open={contextMenuOpen}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        />
      </ReactFlow>
    </div>
  );
}
