import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

import classNames from "classnames";
import { useId } from "react";

import styles from "./Input.module.scss";

type InputSize = "small" | "medium" | "large";
type InputVariant = "default" | "filled" | "outline";
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

type ErrorTextColor = "primary" | "secondary" | "hover" | "danger";
type ErrorTextType = PlaceholderType;

type CommonProps = {
  backgroundType?: BackgroundType;
  borderType?: BorderType;
  className?: string;
  color?: TextColor;
  error?: boolean;
  errorMessage?: string;
  errorText?: string;
  errorTextColor?: ErrorTextColor;
  errorTextType?: ErrorTextType;
  inputType: "input" | "textarea";
  leftIcon?: ReactNode;
  placeholderColor?: PlaceholderColor;
  placeholderType?: PlaceholderType;
  rightIcon?: ReactNode;
  size?: InputSize;
  variant?: InputVariant;
};

type InputAsInput = CommonProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    inputType: "input";
  };

type InputAsTextarea = CommonProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    inputType: "textarea";
  };

type InputProps = InputAsInput | InputAsTextarea;

export function Input({
  backgroundType = "default",
  borderType = "default",
  className,
  color = "primary",
  error,
  errorMessage,
  errorText,
  errorTextColor = "danger",
  errorTextType = "small",
  inputType = "input",
  leftIcon,
  placeholderColor = "secondary",
  placeholderType = "normal",
  rightIcon,
  size = "medium",
  variant = "default",
  ...nativeProps
}: InputProps) {
  const reactGeneratedId = useId();
  const nativeId = (nativeProps as { id?: string }).id;
  const inputId = nativeId ?? `input-${reactGeneratedId}`;
  const message = errorMessage ?? errorText;
  const errorId = `${inputId}-error`;
  const existingDescribedBy = (
    nativeProps as {
      "aria-describedby"?: string;
    }
  )["aria-describedby"];
  const ariaDescribedBy =
    [existingDescribedBy, message ? errorId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  const ariaInvalid = error || !!message || undefined;
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
    inputType === "textarea" ? styles.textarea : styles.input,
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
    <>
      <div className={containerClass}>
        {leftIcon && <div className={styles["left-icon"]}>{leftIcon}</div>}
        {inputType === "textarea" ? (
          <textarea
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            className={inputClass}
            {...(nativeProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            className={inputClass}
            {...(nativeProps as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {rightIcon && <div className={styles["right-icon"]}>{rightIcon}</div>}
      </div>
      {message && (
        <div
          className={classNames(styles["error-text"], {
            [styles["error-text-danger"]]: errorTextColor === "danger",
            [styles["error-text-h1"]]: errorTextType === "H1",
            [styles["error-text-h2"]]: errorTextType === "H2",
            [styles["error-text-h3"]]: errorTextType === "H3",
            [styles["error-text-h4"]]: errorTextType === "H4",
            [styles["error-text-h5"]]: errorTextType === "H5",
            [styles["error-text-hover"]]: errorTextColor === "hover",
            [styles["error-text-large"]]: errorTextType === "large",
            [styles["error-text-normal"]]: errorTextType === "normal",
            [styles["error-text-primary"]]: errorTextColor === "primary",
            [styles["error-text-secondary"]]: errorTextColor === "secondary",
            [styles["error-text-small"]]: errorTextType === "small",
          })}
          id={errorId}
        >
          {message}
        </div>
      )}
    </>
  );
}
