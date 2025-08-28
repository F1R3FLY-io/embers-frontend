import type { Node, NodeProps } from "@xyflow/react";

import { NodeToolbar, Position } from "@xyflow/react";

import { Text } from "@/lib/components/Text";

import styles from "./DeployContainer.module.scss";

type DeployContainerNodeProps = {
  containerId: string;
};

export function DeployContainerNode({
  data,
}: NodeProps<Node<DeployContainerNodeProps>>) {
  return (
    <div className={styles.container}>
      <NodeToolbar isVisible align="end" position={Position.Top}>
        <Text color="primary" type="small">
          {data.containerId}
        </Text>
      </NodeToolbar>
    </div>
  );
}
