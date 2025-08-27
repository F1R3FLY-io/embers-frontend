import classNames from "classnames";
import type { ReactNode } from "react";

import styles from "./Text.module.scss";

type TextProps = {
  bold?: true;
  children: ReactNode;
  className?: string;
  color?: "primary" | "secondary";
  fontSize?: number;
  type?: "H1" | "H2" | "H3" | "H4" | "H5" | "large" | "normal" | "small";
};

export function Text({ bold, children, className, color, fontSize, type }: TextProps) {
  const textClass = classNames(
    styles.text,
    {
      [styles.bold]: bold,
      [styles.h1]: type === "H1",
      [styles.h2]: type === "H2",
      [styles.h3]: type === "H3",
      [styles.h4]: type === "H4",
      [styles.h5]: type === "H5",
      [styles.large]: type === "large",
      [styles.normal]: type === "normal" || type === undefined,
      [styles.primary]: color === "primary",
      [styles.secondary]: color === "secondary",
      [styles.small]: type === "small",
    },
    className,
  );

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
