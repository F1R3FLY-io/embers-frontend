import type { ReactNode } from "react";

import classNames from "classnames";

import styles from "./GroupButton.module.scss";

interface GroupButtonProps {
  children: ReactNode;
  icon: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export function GroupButton({
  children,
  icon,
  isSelected,
  onClick,
}: GroupButtonProps) {
  return (
    <button
      className={classNames(styles["agents-button"], {
        [styles.selected]: isSelected,
      })}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
