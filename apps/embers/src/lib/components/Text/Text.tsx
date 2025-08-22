import type { ReactNode } from "react";

import classNames from "classnames";

import styles from "./Text.module.scss";

type TextProps = {
  bold?: true;
  children: ReactNode;
  color?: "primary" | "secondary";
  fontSize?: number;
  type?: "H2" | "H3" | "H4";
};

export function Text({ bold, children, color, fontSize, type }: TextProps) {
  const textClass = classNames(styles.text, {
    [styles.bold]: bold,
    [styles.h2]: type === "H2",
    [styles.h3]: type === "H3",
    [styles.h4]: type === "H4",
    [styles.primary]: color === "primary",
    [styles.secondary]: color === "secondary",
    [styles["default-size"]]: type === undefined,
  });

  return (
    <span
      className={textClass}
      style={{
        fontSize,
      }}
    >
      {children}
    </span>
  );
}
