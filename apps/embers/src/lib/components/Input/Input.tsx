import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import classNames from "classnames";

import styles from "./Input.module.scss";

type InputSize = "small" | "medium" | "large";
type InputVariant = "default" | "filled" | "outline";
type InputType = "input" | "textarea";
type PlaceholderType = "H1" | "H2" | "H3" | "H4" | "H5" | "large" | "normal" | "small";
type TextColor = "primary" | "secondary" | "hover";
type PlaceholderColor = "primary" | "secondary" | "hover";
type BackgroundType = "default" | "neutral" | "surface" | "transparent";
type BorderType = "none" | "default" | "primary" | "selected" | "danger" | "subtle";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  className?: string;
  error?: boolean;
  as?: InputType;
  size?: InputSize;
  variant?: InputVariant;
  placeholderType?: PlaceholderType;
  color?: TextColor;
  placeholderColor?: PlaceholderColor;
  backgroundType?: BackgroundType;
  borderType?: BorderType;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  // Allow textarea-specific props when as="textarea"
  rows?: number;
  cols?: number;
}

export function Input({
  className,
  error,
  as = "input",
  size = "medium",
  variant = "default",
  placeholderType = "normal",
  color = "primary",
  placeholderColor = "secondary",
  backgroundType = "default",
  borderType = "default",
  leftIcon,
  rightIcon,
  ...inputProps
}: InputProps) {
  const containerClass = classNames(
    styles.container,
    {
      [styles.error]: error,
      [styles.small]: size === "small",
      [styles.medium]: size === "medium",
      [styles.large]: size === "large",
      [styles.filled]: variant === "filled",
      [styles.outline]: variant === "outline",
      [styles.backgroundNeutral]: backgroundType === "neutral",
      [styles.backgroundSurface]: backgroundType === "surface",
      [styles.backgroundTransparent]: backgroundType === "transparent",
      [styles.borderNone]: borderType === "none",
      [styles.borderPrimary]: borderType === "primary",
      [styles.borderSelected]: borderType === "selected",
      [styles.borderDanger]: borderType === "danger",
      [styles.borderSubtle]: borderType === "subtle",
      [styles.hasLeftIcon]: leftIcon,
      [styles.hasRightIcon]: rightIcon,
    },
    className,
  );

  const inputClass = classNames(
    as === "textarea" ? styles.textarea : styles.input,
    {
      [styles.small]: size === "small",
      [styles.medium]: size === "medium", 
      [styles.large]: size === "large",
      [styles.textPrimary]: color === "primary",
      [styles.textSecondary]: color === "secondary",
      [styles.textHover]: color === "hover",
      [styles.placeholderH1]: placeholderType === "H1",
      [styles.placeholderH2]: placeholderType === "H2",
      [styles.placeholderH3]: placeholderType === "H3",
      [styles.placeholderH4]: placeholderType === "H4",
      [styles.placeholderH5]: placeholderType === "H5",
      [styles.placeholderLarge]: placeholderType === "large",
      [styles.placeholderNormal]: placeholderType === "normal" || placeholderType === undefined,
      [styles.placeholderSmall]: placeholderType === "small",
      [styles.placeholderPrimary]: placeholderColor === "primary",
      [styles.placeholderSecondary]: placeholderColor === "secondary" || placeholderColor === undefined,
      [styles.placeholderHover]: placeholderColor === "hover",
    },
  );

  const InputElement = as === "textarea" ? "textarea" : "input";

  return (
    <div className={containerClass}>
      {leftIcon && <div className={styles.leftIcon}>{leftIcon}</div>}
      <InputElement className={inputClass} {...inputProps} />
      {rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
    </div>
  );
}