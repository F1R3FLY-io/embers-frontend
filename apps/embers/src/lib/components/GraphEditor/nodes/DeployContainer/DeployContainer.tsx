import type { Node, NodeProps } from "@xyflow/react";

import { NodeResizer, NodeToolbar, Position } from "@xyflow/react";

import { Text } from "@/lib/components/Text";

import styles from "./DeployContainer.module.scss";

type DeployContainerNodeProps = { containerId: string };

export function DeployContainerNode({
  data,
  selected,
}: NodeProps<Node<DeployContainerNodeProps>>) {
  return (
    <div className={styles.container}>
      <NodeResizer isVisible={selected} minHeight={220} minWidth={360} />
      <NodeToolbar isVisible align="end" position={Position.Top}>
        <Text color="primary" type="small">
          Deploy container · {data.containerId} · Current stack
        </Text>
      </NodeToolbar>
    </div>
  );
}
