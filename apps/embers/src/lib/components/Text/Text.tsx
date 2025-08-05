import type { ReactNode } from "react";

import classNames from "classnames";

import styles from "./Text.module.scss";

type TextProps = {
  children: ReactNode;
  color?: string;
  fontSize?: number;
  fontWeight?: 400 | 600;
  noColour?: boolean;
  style?: React.CSSProperties;
  type?: "title" | "secondary";
};

export default function Text({
  children,
  color,
  fontSize,
  fontWeight,
  noColour,
  style,
  type,
}: TextProps) {
  const textClass = classNames(styles.text, {
    [styles.secondary]: type === "secondary",
    [styles.title]: type === "title",
    [styles["no-color"]]: noColour,
  });

  return (
    <span
      className={textClass}
      style={{ color, fontSize, fontWeight, ...style }}
    >
      {children}
    </span>
  );
}
