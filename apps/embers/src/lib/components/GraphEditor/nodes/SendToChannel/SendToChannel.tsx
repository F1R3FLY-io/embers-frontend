import type { Node, NodeProps } from "@xyflow/react";

import { Position } from "@xyflow/react";

import { Text } from "@/lib/components/Text";

import { NodeContainer } from "../NodeContainer";
import styles from "./SendToChannel.module.scss";

export function SendToChannel({ selected }: NodeProps<Node>) {
  return (
    <NodeContainer
      className={styles.container}
      handlers={[{ position: Position.Left, type: "target" }]}
      selected={selected}
      selectedClassName={styles.selected}
    >
      <Text color="primary">Send to channel</Text>
    </NodeContainer>
  );
}
