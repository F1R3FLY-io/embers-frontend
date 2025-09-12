import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

import classNames from "classnames";

import styles from "./Input.module.scss";

type InputSize = "small" | "medium" | "large";
type InputVariant = "default" | "filled" | "outline";
type InputType = "input" | "textarea";
type PlaceholderType =
  | "H1"
  | "H2"
  | "H3"
  | "H4"
  | "H5"
  | "large"
  | "normal"
  | "small";
type TextColor = "primary" | "secondary" | "hover";
type PlaceholderColor = "primary" | "secondary" | "hover";
type BackgroundType = "default" | "neutral" | "surface" | "transparent";
type BorderType =
  | "none"
  | "default"
  | "primary"
  | "selected"
  | "danger"
  | "subtle";

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  as?: InputType;
  backgroundType?: BackgroundType;
  borderType?: BorderType;
  className?: string;
  color?: TextColor;
  cols?: number;
  error?: boolean;
  leftIcon?: ReactNode;
  placeholderColor?: PlaceholderColor;
  placeholderType?: PlaceholderType;
  rightIcon?: ReactNode;
  // Allow textarea-specific props when as="textarea"
  rows?: number;
  size?: InputSize;
  variant?: InputVariant;
}

export function Input({
  as = "input",
  backgroundType = "default",
  borderType = "default",
  className,
  color = "primary",
  cols,
  error,
  leftIcon,
  placeholderColor = "secondary",
  placeholderType = "normal",
  rightIcon,
  rows,
  size = "medium",
  variant = "default",
  ...inputProps
}: InputProps) {
  const containerClass = classNames(
    styles.container,
    {
      [styles.error]: error,
      [styles.filled]: variant === "filled",
      [styles.large]: size === "large",
      [styles.medium]: size === "medium",
      [styles.outline]: variant === "outline",
      [styles.small]: size === "small",
      [styles["background-neutral"]]: backgroundType === "neutral",
      [styles["background-surface"]]: backgroundType === "surface",
      [styles["background-transparent"]]: backgroundType === "transparent",
      [styles["border-danger"]]: borderType === "danger",
      [styles["border-none"]]: borderType === "none",
      [styles["border-primary"]]: borderType === "primary",
      [styles["border-selected"]]: borderType === "selected",
      [styles["border-subtle"]]: borderType === "subtle",
      [styles["has-left-icon"]]: leftIcon,
      [styles["has-right-icon"]]: rightIcon,
    },
    className,
  );

  const inputClass = classNames(
    as === "textarea" ? styles.textarea : styles.input,
    {
      [styles.large]: size === "large",
      [styles.medium]: size === "medium",
      [styles.small]: size === "small",
      [styles["placeholder-h1"]]: placeholderType === "H1",
      [styles["placeholder-h2"]]: placeholderType === "H2",
      [styles["placeholder-h3"]]: placeholderType === "H3",
      [styles["placeholder-h4"]]: placeholderType === "H4",
      [styles["placeholder-h5"]]: placeholderType === "H5",
      [styles["placeholder-hover"]]: placeholderColor === "hover",
      [styles["placeholder-large"]]: placeholderType === "large",
      [styles["placeholder-normal"]]: placeholderType === "normal",
      [styles["placeholder-primary"]]: placeholderColor === "primary",
      [styles["placeholder-secondary"]]: placeholderColor === "secondary",
      [styles["placeholder-small"]]: placeholderType === "small",
      [styles["text-hover"]]: color === "hover",
      [styles["text-primary"]]: color === "primary",
      [styles["text-secondary"]]: color === "secondary",
    },
  );

  return (
    <div className={containerClass}>
      {leftIcon && <div className={styles["left-icon"]}>{leftIcon}</div>}
      {as === "textarea" ? (
        <textarea
          className={inputClass}
          cols={cols}
          rows={rows}
          {...(inputProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={inputClass}
          {...(inputProps as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {rightIcon && <div className={styles["right-icon"]}>{rightIcon}</div>}
    </div>
  );
}
