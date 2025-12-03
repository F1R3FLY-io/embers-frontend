import type React from "react";

import classNames from "classnames";

import { Text } from "@/lib/components/Text";
import DragHandler from "@/public/icons/drag-handler.svg?react";
import PlusIcon from "@/public/icons/plus-1-icon.svg?react";

import styles from "./NodeItem.module.scss";

interface NodeItemProps {
  iconSrc?: string;
  name: string;
  type?: string;
}

export const NodeItem: React.FC<NodeItemProps> = ({ iconSrc, name, type }) => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    event.dataTransfer.setData("application/reactflow", type ?? "");
    event.dataTransfer.setData(
      "application/reactflow-offset",
      JSON.stringify(offset),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      className={styles["node-item"]}
      onDragStart={handleDragStart}
    >
      <img alt="" src={iconSrc} />
      <Text bold className={styles["node-name"]} type="small">
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
