import type { Connection, EdgeChange, NodeChange } from "@xyflow/react";
import type { MouseEvent as ReactMouseEvent } from "react";

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

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";
import type { WorkflowDefinitionV2, WorkflowDiagnostic } from "@/lib/workflow";

import { ContextMenu } from "@/lib/components/ContextMenu";
import { nodeTypes } from "@/lib/components/GraphEditor/nodes";
import { useModal } from "@/lib/providers/modal/useModal";
import { toWorkflowDefinition, validateWorkflow } from "@/lib/workflow";

import type { ContextMenuInput } from "./menuItems";
import type { NodeKind } from "./nodes/nodes.registry";

import styles from "./GraphEditor.module.scss";
import { buildMenuItems, createNodeChange } from "./menuItems";
import { EditModal } from "./nodes/EditModal";
import { NODE_REGISTRY } from "./nodes/nodes.registry";

type GraphEditorProps = {
  baseDefinition?: WorkflowDefinitionV2;
  edges: Edge[];
  nodes: Node[];
  onGraphChange: () => void;
  setEdges: (change: (state: Edge[]) => Edge[]) => void;
  setNodes: (change: (state: Node[]) => Node[]) => void;
};

export function GraphEditor({
  baseDefinition,
  edges,
  nodes,
  onGraphChange,
  setEdges,
  setNodes,
}: GraphEditorProps) {
  const { open } = useModal();
  const rf = useReactFlow<Node, Edge>();
  const diagnostics = useMemo((): WorkflowDiagnostic[] => {
    try {
      return validateWorkflow(
        toWorkflowDefinition(nodes, edges, baseDefinition),
      );
    } catch (error) {
      return [
        {
          code: "invalid-canvas-projection",
          message:
            error instanceof Error
              ? error.message
              : "The workflow canvas cannot be serialized.",
          severity: "error",
        },
      ];
    }
  }, [baseDefinition, edges, nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes((nodesSnapshot) => {
        const structuralChange = changes.some(
          (change) =>
            change.type === "remove" ||
            change.type === "add" ||
            change.type === "replace",
        );
        if (structuralChange) {
          queueMicrotask(onGraphChange);
        }
        return applyNodeChanges(changes, nodesSnapshot);
      });
    },
    [onGraphChange, setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((edgesSnapshot) => {
        const structuralChange = changes.some(
          (change) =>
            change.type === "remove" ||
            change.type === "add" ||
            change.type === "replace",
        );
        if (structuralChange) {
          queueMicrotask(onGraphChange);
        }
        return applyEdgeChanges(changes, edgesSnapshot);
      });
    },
    [onGraphChange, setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((edgesSnapshot) => {
        queueMicrotask(onGraphChange);
        const transitionId = crypto.randomUUID();
        return addEdge(
          {
            ...connection,
            data: {
              noMatch: "fail",
              priority: 0,
              routeMode: "allMatches",
              transitionId,
              trigger: "completed",
            },
            id: transitionId,
            label: "completed: always",
          },
          edgesSnapshot,
        );
      });
    },
    [setEdges, onGraphChange],
  );

  const deleteContainer = useCallback(
    (container: Node) => {
      setNodes((nodesSnapshot) =>
        nodesSnapshot.flatMap((node) => {
          if (node.id === container.id) {
            return [];
          }
          if (node.parentId !== container.id) {
            return [node];
          }

          const { extent: _extent, parentId: _parentId, ...child } = node;
          return [
            {
              ...child,
              ...(container.parentId === undefined
                ? {}
                : { extent: "parent" as const, parentId: container.parentId }),
              position: {
                x: container.position.x + node.position.x,
                y: container.position.y + node.position.y,
              },
            } as Node,
          ];
        }),
      );
      setEdges((edgesSnapshot) =>
        edgesSnapshot.filter(
          (edge) =>
            edge.source !== container.id && edge.target !== container.id,
        ),
      );
      queueMicrotask(onGraphChange);
    },
    [onGraphChange, setEdges, setNodes],
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
            deleteContainer,
            onEdgesChange,
            onNodesChange,
            open,
            rf,
          })
        : [],
    [contextMenuInput, deleteContainer, onEdgesChange, onNodesChange, open, rf],
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

          let dragData: Record<string, string> = {};
          const rawData = event.dataTransfer.getData(
            "application/reactflow-data",
          );
          if (rawData) {
            try {
              dragData = JSON.parse(rawData) as Record<string, string>;
            } catch {
              dragData = {};
            }
          }

          // An agent node without an identity would compile to an invalid
          // graph, so refuse the drop rather than create a broken node.
          if (type === "agent" && typeof dragData.agentId !== "string") {
            return;
          }

          const data = { ...NODE_REGISTRY[type].defaultData, ...dragData };

          const position = rf.screenToFlowPosition({
            x: event.clientX - offsetX,
            y: event.clientY - offsetY,
          });

          if (NODE_REGISTRY[type].modalInputs.length === 0) {
            onNodesChange(createNodeChange(type, position, data));
          } else {
            open(
              <EditModal
                initial={data}
                inputs={NODE_REGISTRY[type].modalInputs}
                title={`Configure ${NODE_REGISTRY[type].displayName}`}
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
        onNodeContextMenu={openNodeContextMenu}
        onNodesChange={onNodesChange}
        onPaneContextMenu={openEmptySpaceContextMenu}
        onSelectionContextMenu={openSelectionContextMenu}
      >
        {diagnostics.length > 0 && (
          <div className={styles.diagnostics} role="status">
            <strong>
              {
                diagnostics.filter(({ severity }) => severity === "error")
                  .length
              }{" "}
              publish issue(s)
            </strong>
            {diagnostics.slice(0, 4).map((diagnostic) => (
              <span key={`${diagnostic.code}:${diagnostic.id ?? "workflow"}`}>
                {diagnostic.message}
              </span>
            ))}
          </div>
        )}
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
