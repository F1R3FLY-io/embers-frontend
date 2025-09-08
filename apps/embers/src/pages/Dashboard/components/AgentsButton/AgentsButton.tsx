import type { ReactNode } from "react";

import classNames from "classnames";

import styles from "./AgentsButton.module.scss";

interface AgentsButtonProps {
  children: ReactNode;
  icon: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export function AgentsButton({
  children,
  icon,
  isSelected,
  onClick,
}: AgentsButtonProps) {
  return (
    <button
      className={classNames(
        styles["agents-button"],
        isSelected && styles.selected,
      )}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
