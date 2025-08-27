import type { ReactNode } from "react";

import styles from "./TextLink.module.scss";

type TextLinkProps = {
  children: ReactNode;
  onClick: () => void;
};

export function TextLink({ children, onClick }: TextLinkProps) {
  return (
    <span className={styles.text} onClick={onClick}>
      {children}
    </span>
  );
}
