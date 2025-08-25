import classNames from "classnames";
import { ReactNode } from "react";

import styles from "./AgentsButton.module.scss";

interface AgentsButtonProps {
  icon: ReactNode;
  children: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export function AgentsButton({ icon, children, isSelected, onClick }: AgentsButtonProps) {
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
