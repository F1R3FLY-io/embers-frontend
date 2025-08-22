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

import { ContextMenu } from "@/lib/components/ContextMenu";
import { Text } from "@/lib/components/Text";

import type { NodeTypes } from "./nodes";

import styles from "./GraphEditor.module.scss";
import { nodeTypes } from "./nodes";

type Node = {
  [K in keyof NodeTypes]: RNode<Parameters<NodeTypes[K]>[0]["data"], K>;
}[keyof NodeTypes];

type Edge = REdge;

export function GraphEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
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

  const openContextMenu = useCallback((event: ReactMouseEvent | MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuOpen(true);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuOpen(false);
  }, []);

  const { screenToFlowPosition } = useReactFlow();
  const menuItems = useMemo(
    () => [
      {
        element: <Text>Add input</Text>,
        onClick: () => {
          setNodes((edgesSnapshot) => [
            ...edgesSnapshot,
            addNode("manual-input", screenToFlowPosition(contextMenuPosition)),
          ]);
        },
      },
      {
        element: <Text>Add sink</Text>,
        onClick: () => {
          setNodes((edgesSnapshot) => [
            ...edgesSnapshot,
            addNode(
              "send-to-channel",
              screenToFlowPosition(contextMenuPosition),
            ),
          ]);
        },
      },
      {
        element: <Text>Add compress</Text>,
        onClick: () => {
          setNodes((edgesSnapshot) => [
            ...edgesSnapshot,
            addNode("compress", screenToFlowPosition(contextMenuPosition)),
          ]);
        },
      },
      {
        element: <Text>Add text model</Text>,
        onClick: () => {
          setNodes((edgesSnapshot) => [
            ...edgesSnapshot,
            addNode("text-model", screenToFlowPosition(contextMenuPosition)),
          ]);
        },
      },
      {
        element: <Text>Add text to image model</Text>,
        onClick: () => {
          setNodes((edgesSnapshot) => [
            ...edgesSnapshot,
            addNode("tti-model", screenToFlowPosition(contextMenuPosition)),
          ]);
        },
      },
      {
        element: <Text>Add text to speech model</Text>,
        onClick: () => {
          setNodes((edgesSnapshot) => [
            ...edgesSnapshot,
            addNode("tts-model", screenToFlowPosition(contextMenuPosition)),
          ]);
        },
      },
    ],
    [contextMenuPosition, screenToFlowPosition, setNodes],
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

function addNode<T extends Node>(
  type: T["type"],
  position: T["position"],
): Node {
  return {
    className: styles["no-node-style"],
    data: {},
    id: crypto.randomUUID(),
    position,
    type,
  };
}
