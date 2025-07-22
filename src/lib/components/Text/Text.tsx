import classNames from "classnames";

import styles from "./Text.module.scss";

type TextProps = {
  type?: "title" | "secondary";
  children: string;
  noColour?: boolean;
  fontSize?: number;
  fontWeight?: 400 | 600;
};

export default function Text({
  type,
  children,
  noColour,
  fontSize,
  fontWeight,
}: TextProps) {
  const textClass = classNames(styles.text, {
    [styles.title]: type === "title",
    [styles.secondary]: type === "secondary",
    [styles["no-color"]]: noColour,
  });

  return (
    <div style={{ fontSize, fontWeight }} className={textClass}>
      {children}
    </div>
  );
}
