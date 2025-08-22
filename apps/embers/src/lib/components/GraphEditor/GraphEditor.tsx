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
import { useCallback, useState } from "react";

import { ContextMenu } from "@/lib/components/ContextMenu";
import { Text } from "@/lib/components/Text";

import type { NodeTypes } from "./nodes";

import styles from "./GraphEditor.module.scss";
import { nodeTypes } from "./nodes";

export function GraphEditor() {
  const { screenToFlowPosition } = useReactFlow();

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

  const addInputNode = useCallback(() => {
    setNodes((edgesSnapshot) => [
      ...edgesSnapshot,
      {
        className: styles["no-node-style"],
        data: {},
        id: crypto.randomUUID(),
        position: screenToFlowPosition(contextMenuPosition),
        type: "manual-input",
      },
    ]);
  }, [contextMenuPosition, screenToFlowPosition, setNodes]);

  const addSinkNode = useCallback(() => {
    setNodes((edgesSnapshot) => [
      ...edgesSnapshot,
      {
        className: styles["no-node-style"],
        data: {},
        id: crypto.randomUUID(),
        position: screenToFlowPosition(contextMenuPosition),
        type: "send-to-channel",
      },
    ]);
  }, [contextMenuPosition, screenToFlowPosition, setNodes]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <ReactFlow
        fitView
        defaultEdgeOptions={{ animated: true }}
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
          open={contextMenuOpen}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        >
          <div onClick={addInputNode}>
            <Text>Add input</Text>
          </div>
          <div onClick={addSinkNode}>
            <Text>Add sink</Text>
          </div>
        </ContextMenu>
      </ReactFlow>
    </div>
  );
}

type Node = {
  [K in keyof NodeTypes]: RNode<Parameters<NodeTypes[K]>[0]["data"], K>;
}[keyof NodeTypes];

type Edge = REdge;
