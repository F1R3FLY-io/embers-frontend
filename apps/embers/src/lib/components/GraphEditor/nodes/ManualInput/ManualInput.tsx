import type { Node, NodeProps } from "@xyflow/react";

import { Position } from "@xyflow/react";

import { Text } from "@/lib/components/Text";

import { NodeContainer } from "../NodeContainer";
import styles from "./ManualInput.module.scss";

export function ManualInput({ selected }: NodeProps<Node>) {
  return (
    <NodeContainer
      className={styles.container}
      handlers={[{ position: Position.Right, type: "source" }]}
      selected={selected}
      selectedClassName={styles.selected}
    >
      <Text className={styles.text}>Manual Input</Text>
    </NodeContainer>
  );
}
