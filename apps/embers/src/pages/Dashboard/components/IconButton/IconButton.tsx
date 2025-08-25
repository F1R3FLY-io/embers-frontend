import type { ReactNode } from "react";

import styles from "./IconButton.module.scss";

interface IconButtonProps {
  children: ReactNode;
  className?: string;
  icon: ReactNode;
  onClick?: () => void;
}

export function IconButton({ children, icon, onClick }: IconButtonProps) {
  return (
    <button className={styles["icon-button"]} onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
