import type { ReactNode } from "react";

import classNames from "classnames";

import styles from "./Text.module.scss";

type TextProps = {
  children: ReactNode;
  fontSize?: number;
  fontWeight?: 400 | 600;
  type?: "title" | "primary" | "secondary";
};

export default function Text({
  children,
  fontSize,
  fontWeight,
  type,
}: TextProps) {
  const textClass = classNames(styles.text, {
    [styles.primary]: type === "primary",
    [styles.secondary]: type === "secondary",
    [styles.title]: type === "title",
  });

  const customStyle = {
    fontSize,
    fontWeight,
  };

  return (
    <span className={textClass} style={customStyle}>
      {children}
    </span>
  );
}
