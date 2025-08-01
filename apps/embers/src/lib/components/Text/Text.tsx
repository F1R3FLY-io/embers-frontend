import type { ReactNode } from "react";

import classNames from "classnames";

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
