import classNames from "classnames";
import { type ReactNode } from "react";

import styles from "./Text.module.scss";

type TextProps = {
  children: ReactNode;
  fontSize?: number;
  fontWeight?: 400 | 600;
  noColour?: boolean;
  type?: "title" | "secondary";
};

export default function Text({
  children,
  fontSize,
  fontWeight,
  noColour,
  type,
}: TextProps) {
  const textClass = classNames(styles.text, {
    [styles.secondary]: type === "secondary",
    [styles.title]: type === "title",
    [styles["no-color"]]: noColour,
  });

  return (
    <span className={textClass} style={{ fontSize, fontWeight }}>
      {children}
    </span>
  );
}
