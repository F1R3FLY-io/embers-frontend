import type { HandleType, NodeProps, Position } from "@xyflow/react";
import type { FC, ReactNode } from "react";

import { Handle } from "@xyflow/react";
import classNames from "classnames";

import { Text } from "@/lib/components/Text";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import styles from "./NodeTemplate.module.scss";

export type NodeTemplateProps = {
  className?: string;
  displayName: string;
  handlers?: {
    position: Position;
    type: HandleType;
  }[];
  icon: ReactNode;
  labelKey?: string;
  title: string;
};

export function NodeTemplate({
  className,
  displayName,
  handlers,
  icon,
  labelKey,
  title,
}: NodeTemplateProps) {
  const component: FC<NodeProps> = ({ data, selected }) => {
    const containerClassName = classNames(styles.container, className, {
      [styles.selected]: selected,
    });

    // Node kinds that name themselves per instance (agents) opt in via
    // `labelKey`; every built-in kind leaves it unset and keeps its title.
    const labelValue = labelKey === undefined ? undefined : data[labelKey];
    const label =
      typeof labelValue === "string" && labelValue !== "" ? labelValue : title;

    return (
      <div className={containerClassName}>
        <div className={styles.content}>
          {icon}
          <Text bold color="primary" type="normal">
            {label}
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
