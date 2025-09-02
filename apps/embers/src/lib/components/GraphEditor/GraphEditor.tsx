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

import { ContextMenu } from "@/lib/components/ContextMenu";

import type { NodeTypes } from "./nodes";

import styles from "./GraphEditor.module.scss";
import { nodeTypes } from "./nodes";

type Node = {
  [K in keyof NodeTypes]: RNode<Parameters<NodeTypes[K]>[0]["data"], K>;
}[keyof NodeTypes];

type Edge = REdge;

export function GraphEditor() {
  const [nodes, , onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
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
    (event: ReactMouseEvent | MouseEvent, selectedNodes: Node[]) => {
      setSelectedNodes(selectedNodes);
      openContextMenu(event);
    },
    [openContextMenu],
  );
  const closeContextMenu = useCallback(() => {
    setSelectedNodes([]);
    setContextMenuOpen(false);
  }, []);

  const { screenToFlowPosition } = useReactFlow();
  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        content: "Add input",
        hidden: selectedNodes.length !== 0,
        onClick: () =>
          onNodesChange(
            createNodeChange(
              "manual-input",
              screenToFlowPosition(contextMenuPosition),
            ),
          ),
        type: "text",
      },
      {
        content: "Add sink",
        hidden: selectedNodes.length !== 0,
        onClick: () =>
          onNodesChange(
            createNodeChange(
              "send-to-channel",
              screenToFlowPosition(contextMenuPosition),
            ),
          ),
        type: "text",
      },
      {
        content: "Add compress",
        hidden: selectedNodes.length !== 0,
        onClick: () =>
          onNodesChange(
            createNodeChange(
              "compress",
              screenToFlowPosition(contextMenuPosition),
            ),
          ),
        type: "text",
      },
      {
        content: "Add text model",
        hidden: selectedNodes.length !== 0,
        onClick: () =>
          onNodesChange(
            createNodeChange(
              "text-model",
              screenToFlowPosition(contextMenuPosition),
            ),
          ),
        type: "text",
      },
      {
        content: "Add text to image model",
        hidden: selectedNodes.length !== 0,
        onClick: () =>
          onNodesChange(
            createNodeChange(
              "tti-model",
              screenToFlowPosition(contextMenuPosition),
            ),
          ),
        type: "text",
      },
      {
        content: "Add text to speech model",
        hidden: selectedNodes.length !== 0,
        onClick: () =>
          onNodesChange(
            createNodeChange(
              "tts-model",
              screenToFlowPosition(contextMenuPosition),
            ),
          ),
        type: "text",
      },
      {
        content: "Add to deploy container",
        hidden: selectedNodes.length === 0,
        onClick: () => {
          const minX = Math.min(...selectedNodes.map((n) => n.position.x));
          const maxX = Math.max(
            ...selectedNodes.map((n) => n.position.x + n.measured!.width!),
          );

          const minY = Math.min(...selectedNodes.map((n) => n.position.y));
          const maxY = Math.max(
            ...selectedNodes.map((n) => n.position.y + n.measured!.height!),
          );

          const subflowNode: Node = {
            className: styles["no-node-style"],
            data: {
              containerId: "default",
            },
            id: crypto.randomUUID(),
            position: { x: minX - 5, y: minY - 5 },
            style: {
              height: maxY - minY + 10,
              width: maxX - minX + 10,
            },
            type: "deploy-container",
          };

          onNodesChange([
            {
              // parent should come before children
              index: 0,
              item: subflowNode,
              type: "add",
            },
            ...selectedNodes.map((n) => ({
              id: n.id,
              item: {
                ...n,
                extent: "parent" as const,
                parentId: subflowNode.id,
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
      },
    ],
    [contextMenuPosition, onNodesChange, screenToFlowPosition, selectedNodes],
  );

  return (
    <div className={styles.container}>
      <ReactFlow
        fitView
        defaultEdgeOptions={{
          animated: true,
          className: styles.edge,
        }}
        deleteKeyCode={["Delete", "Backspace"]}
        edges={edges}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
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

function createNodeChange<T extends string>(
  type: T,
  position: Node["position"],
) {
  return [
    {
      item: {
        className: styles["no-node-style"],
        data: {},
        id: crypto.randomUUID(),
        position,
        type,
      },
      type: "add" as const,
    },
  ];
}
