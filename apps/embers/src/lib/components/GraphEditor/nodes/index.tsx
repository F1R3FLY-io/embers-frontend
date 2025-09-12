import type { Edge as REdge, Node as RNode } from "@xyflow/react";

import type { NodeRegistry } from "./nodes.registry";

import { DeployContainerNode } from "./DeployContainer";
import styles from "./nodes.module.scss";
import { NODE_REGISTRY } from "./nodes.registry";
import { NodeTemplate } from "./NodeTemplate";

type NodeTemplateProps = Parameters<typeof NodeTemplate>[0];

export type Node = {
  [K in keyof NodeTypes]: RNode<Parameters<NodeTypes[K]>[0]["data"], K>;
}[keyof NodeTypes];

export type Edge = REdge;
export type NodeData<T extends keyof NodeTypes> = Extract<
  Node,
  { type: T }
>["data"];

function makeNodeTypes(registry: NodeRegistry) {
  const entries = Object.entries(registry).map(([type, def]) => {
    const props: NodeTemplateProps = {
      className: styles[def.className],
      displayName: def.displayName,
      handlers: def.handlers,
      icon: <img alt={def.displayName} src={def.iconSrc} />,
      title: def.title,
    };
    return [type, NodeTemplate(props)] as const;
  });
  return Object.fromEntries(entries) as Record<
    keyof NodeRegistry,
    ReturnType<typeof NodeTemplate>
  >;
}

export interface NodeModalProps<T extends keyof NodeTypes> {
  initial: NodeData<T>;
  onCancel?: () => void;
  onSave: (data: NodeData<T>) => void;
}
export const nodeTypes = {
  ...makeNodeTypes(NODE_REGISTRY),
  "deploy-container": DeployContainerNode, // special
} as const;

export type NodeTypes = typeof nodeTypes;
