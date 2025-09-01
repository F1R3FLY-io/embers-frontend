import type React from "react";

import classNames from "classnames";

import { Text } from "@/lib/components/Text";
import DragHandler from "@/public/icons/drag-handler.svg?react";
import defaultNodeIcon from "@/public/icons/placeholder-node.png";
import PlusIcon from "@/public/icons/plus-1-icon.svg?react";

import styles from "./NodeItem.module.scss";

interface NodeItemProps {
  name: string;
  type?: string;
}

export const NodeItem: React.FC<NodeItemProps> = ({ name, type }) => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("application/reactflow", type ?? "");
    event.dataTransfer.effectAllowed = "move";
  };
  return (
    <div
      draggable
      className={styles["node-item"]}
      onDragStart={handleDragStart}
    >
      <img alt="" src={defaultNodeIcon} />
      <Text className={styles["node-name"]} type="small">
        {name}
      </Text>
      <div className={styles["node-actions"]}>
        <div
          className={classNames(
            styles["icon-container"],
            styles["icon-container-plus"],
          )}
        >
          <PlusIcon />
        </div>
        <div className={styles["icon-container"]}>
          <DragHandler />
        </div>
      </div>
    </div>
  );
};
