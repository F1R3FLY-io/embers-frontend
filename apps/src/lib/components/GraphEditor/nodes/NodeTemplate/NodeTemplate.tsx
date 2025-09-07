import type { HandleType, NodeProps, Position } from "@xyflow/react";
import type { FC, ReactNode } from "react";

import { Handle } from "@xyflow/react";
import classNames from "classnames";

import { Text } from "@/lib/components/Text";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import styles from "./NodeTemplate.module.scss";

type NodeTemplateProps = {
  className?: string;
  displayName: string;
  handlers?: {
    position: Position;
    type: HandleType;
  }[];
  icon: ReactNode;
  title: string;
};

export function NodeTemplate({
  className,
  displayName,
  handlers,
  icon,
  title,
}: NodeTemplateProps) {
  const component: FC<NodeProps> = ({ selected }) => {
    const containerClassName = classNames(styles.container, className, {
      [styles.selected]: selected,
    });

    return (
      <div className={containerClassName}>
        <div className={styles.content}>
          {icon}
          <Text bold color="primary" type="normal">
            {title}
          </Text>
          <SettingsIcon className={styles["settings-icon"]} />
        </div>
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
