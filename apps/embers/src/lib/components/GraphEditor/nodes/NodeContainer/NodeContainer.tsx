import type { HandleType, Position } from "@xyflow/react";
import type { ReactNode } from "react";

import { Handle } from "@xyflow/react";
import classNames from "classnames";

import styles from "./NodeContainer.module.scss";

type NodeContainerProps = {
  children: ReactNode;
  className?: string;
  handlers?: {
    position: Position;
    type: HandleType;
  }[];
  selected: boolean;
  selectedClassName: string;
};

export function NodeContainer({
  children,
  className,
  handlers,
  selected,
  selectedClassName,
}: NodeContainerProps) {
  const containerClassName = classNames(styles.container, className, {
    [selectedClassName]: selected,
    [styles.selected]: selected,
  });

  return (
    <div className={containerClassName}>
      {children}
      {handlers?.map(({ position, type }, index) => (
        <Handle
          key={index}
          className={styles.handle}
          position={position}
          type={type}
        />
      ))}
    </div>
  );
}
