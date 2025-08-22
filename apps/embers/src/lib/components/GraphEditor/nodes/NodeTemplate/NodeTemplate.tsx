import type { HandleType, NodeProps, Position } from "@xyflow/react";
import type { FC, ReactNode } from "react";

import { Handle } from "@xyflow/react";
import classNames from "classnames";

import styles from "./NodeTemplate.module.scss";

type NodeTemplateProps = {
  children: ReactNode;
  className?: string;
  displayName: string;
  handlers?: {
    position: Position;
    type: HandleType;
  }[];
};

export function NodeTemplate({
  children,
  className,
  displayName,
  handlers,
}: NodeTemplateProps) {
  const component: FC<NodeProps> = ({ selected }) => {
    const containerClassName = classNames(styles.container, className, {
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
  };
  component.displayName = displayName;

  return component;
}
