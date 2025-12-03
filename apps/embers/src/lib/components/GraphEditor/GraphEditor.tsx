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

type Viewport = { x: number; y: number; zoom: number };

type GraphEditorProps = {
  edges: Edge[];
  initialViewport?: Viewport | undefined;
  nodes: Node[];
  onFlowChange?: (flow: ReactFlowJsonObject<Node, Edge>) => void;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setNodes: Dispatch<SetStateAction<Node[]>>;
};

export function GraphEditor({
  edges,
  initialViewport,
  nodes,
  onFlowChange,
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
    (connection: Connection) =>
      setEdges((edgesSnapshot) => {
        const next = addEdge(connection, edgesSnapshot);
        queueMicrotask(emitFlow);
        return next;
      }),
    [setEdges, emitFlow],
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

  const openNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      setSelectedNodes([node]);
      openContextMenu(event);
    },
    [openContextMenu],
  );

  const closeContextMenu = useCallback(() => {
    setSelectedNodes([]);
    setContextMenuOpen(false);
  }, []);

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
      },
      type: "text",
    }));
  }, [contextMenuPosition, onNodesChange, open, rf, selectedNodes.length]);

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
    }),
    [onNodesChange, selectedNodes],
  );

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

        onNodesChange(changes);
      },
      type: "text",
    };
  }, [nodes, onNodesChange, selectedNodes]);

  const deleteNodesItem: MenuItem = useMemo(
    () => ({
      content:
        selectedNodes.length > 1 ? "Delete selected nodes" : "Delete node",
      hidden: selectedNodes.length === 0,
      onClick: () => {
        const selectedIds = new Set(selectedNodes.map((n) => n.id));
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));

        const containersToRemove = new Set<string>();

        for (const node of selectedNodes) {
          if (node.type === "deploy-container") {
            containersToRemove.add(node.id);
          }

          let current: Node | undefined = node;
          while (current.parentId) {
            const parent = nodeMap.get(current.parentId);
            if (!parent) {
              break;
            }
            if (parent.type === "deploy-container") {
              containersToRemove.add(parent.id);
            }
            current = parent;
          }
        }

        const changes: NodeChange<Node>[] = [];

        containersToRemove.forEach((containerId) => {
          const container = nodeMap.get(containerId);
          if (!container) {
            return;
          }

          const children = nodes.filter((n) => n.parentId === container.id);

          for (const child of children) {
            if (selectedIds.has(child.id)) {
              continue;
            }

            const { extent: _extent, parentId: _parentId, ...rest } = child;

            changes.push({
              id: child.id,
              item: {
                ...rest,
                position: {
                  x: container.position.x + child.position.x,
                  y: container.position.y + child.position.y,
                },
              },
              type: "replace" as const,
            });
          }

          changes.push({ id: container.id, type: "remove" as const });
        });

        selectedIds.forEach((id) => {
          if (containersToRemove.has(id)) {
            return;
          }
          changes.push({ id, type: "remove" as const });
        });

        onNodesChange(changes);
      },
      type: "text",
    }),
    [nodes, onNodesChange, selectedNodes],
  );

  const menuItems = useMemo<MenuItem[]>(
    () => [...addItems, deployItem, deleteDeployItem, deleteNodesItem],
    [addItems, deployItem, deleteDeployItem, deleteNodesItem],
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
              const parsed = JSON.parse(rawOffset) as { x?: number; y?: number };
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
                  onNodesChange(
                    createNodeChange(type, position, updatedData),
                  );
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
        onInit={handleInit}
        onMoveEnd={() => emitFlow()}
        onNodeContextMenu={openNodeContextMenu}
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
