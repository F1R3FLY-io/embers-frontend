import type {
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowJsonObject,
} from "@xyflow/react";
import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
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

  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

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

  const openNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      setSelectedNodes([node]);
      openContextMenu(event);
    },
    [openContextMenu],
  );

  const closeContextMenu = useCallback(() => {
    setSelectedNodes([]);
    setSelectedEdges([]);
    setContextMenuOpen(false);
  }, []);

  const openEdgeContextMenu = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      setSelectedNodes([]);
      setSelectedEdges([edge]);
      openContextMenu(event);
    },
    [openContextMenu],
  );

  const addItems = useMemo<MenuItem[]>(() => {
    return (Object.keys(NODE_REGISTRY) as NodeKind[]).map((type) => ({
      content: `Add ${NODE_REGISTRY[type].displayName}`,
      hidden: selectedNodes.length !== 0,
      onClick: () => {
        const position = rf.screenToFlowPosition(contextMenuPosition);

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
  }, [
    contextMenuPosition,
    notifyGraphChange,
    onNodesChange,
    open,
    rf,
    selectedNodes.length,
  ]);

  const deployItem: MenuItem = useMemo(() => {
    const hasInvalidSelection = selectedNodes.some(
      (n) => n.type === "deploy-container" || !!n.parentId,
    );
    return {
      content: "Add to deploy container",
      hidden: selectedNodes.length === 0 || hasInvalidSelection,
      onClick: () => {
        const minX = Math.min(...selectedNodes.map((n) => n.position.x));
        const maxX = Math.max(
          ...selectedNodes.map((n) => n.position.x + (n.measured!.width ?? 0)),
        );

        const minY = Math.min(...selectedNodes.map((n) => n.position.y));
        const maxY = Math.max(
          ...selectedNodes.map((n) => n.position.y + (n.measured!.height ?? 0)),
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
          ...selectedNodes.map((n) => ({
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
    };
  }, [onNodesChange, selectedNodes]);

  const deleteDeployItem: MenuItem = useMemo(() => {
    const deployContainers = selectedNodes.filter(
      (n) => n.type === "deploy-container",
    );

    return {
      content: "Remove deploy container",
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
    };
  }, [nodes, notifyGraphChange, onNodesChange, selectedNodes]);

  const deleteNodesItem: MenuItem = useMemo(() => {
    const hasDeployContainerSelected = selectedNodes.some(
      (n) => n.type === "deploy-container",
    );

    return {
      content:
        selectedNodes.length > 1 ? "Delete selected nodes" : "Delete node",
      hidden: selectedNodes.length === 0 || hasDeployContainerSelected,
      onClick: () => {
        const selectedIds = new Set(selectedNodes.map((n) => n.id));

        const changes: NodeChange<Node>[] = [];

        selectedIds.forEach((id) => {
          changes.push({ id, type: "remove" as const });
        });

        const remainingNodes = nodes.filter((n) => !selectedIds.has(n.id));

        const containers = nodes.filter((n) => n.type === "deploy-container");

        for (const container of containers) {
          const hasChildrenLeft = remainingNodes.some(
            (n) => n.parentId === container.id,
          );

          if (!hasChildrenLeft) {
            changes.push({
              id: container.id,
              type: "remove" as const,
            });
          }
        }

        notifyGraphChange();
        onNodesChange(changes);
      },
      type: "text",
    };
  }, [nodes, notifyGraphChange, onNodesChange, selectedNodes]);

  const deleteEdgesItem: MenuItem = useMemo(
    () => ({
      content:
        selectedEdges.length > 1
          ? "Delete selected connectors"
          : "Delete connector",
      hidden: selectedEdges.length === 0,
      onClick: () => {
        const changes: EdgeChange<Edge>[] = selectedEdges.map((e) => ({
          id: e.id,
          type: "remove" as const,
        }));

        notifyGraphChange();
        onEdgesChange(changes);
      },
      type: "text",
    }),
    [notifyGraphChange, onEdgesChange, selectedEdges],
  );

  const menuItems = useMemo<MenuItem[]>(
    () => [
      ...addItems,
      deployItem,
      deleteDeployItem,
      deleteNodesItem,
      deleteEdgesItem,
    ],
    [addItems, deployItem, deleteDeployItem, deleteNodesItem, deleteEdgesItem],
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
