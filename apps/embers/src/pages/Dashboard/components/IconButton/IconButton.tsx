import { ReactNode } from "react";

import styles from "./IconButton.module.scss";

interface IconButtonProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function IconButton({ icon, children, onClick, className }: IconButtonProps) {
  return (
    <button className={`${styles["icon-button"]} ${className || ""}`} onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
