import type { Node, NodeProps } from "@xyflow/react";

import { Handle, NodeToolbar, Position } from "@xyflow/react";

import { Text } from "@/lib/components/Text";

import styles from "./DeployContainer.module.scss";

type DeployContainerNodeProps = {
  childScopeId?: string;
  containerId: string;
  entryActivities?: string;
  exitActivities?: string;
  history?: string;
  initialNodeIds?: string;
  scopeKind?: string;
};

export function DeployContainerNode({
  data,
}: NodeProps<Node<DeployContainerNodeProps>>) {
  return (
    <div className={styles.container}>
      <Handle position={Position.Left} type="target" />
      <Handle position={Position.Right} type="source" />
      <NodeToolbar isVisible align="end" position={Position.Top}>
        <Text color="primary" type="small">
          {data.containerId}
        </Text>
      </NodeToolbar>
    </div>
  );
}
