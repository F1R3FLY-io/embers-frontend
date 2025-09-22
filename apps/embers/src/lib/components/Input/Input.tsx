import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
} from "react";

import classNames from "classnames";
import { forwardRef, useId } from "react";

import styles from "./Input.module.scss";

type InputSize = "small" | "medium" | "large";
type InputVariant = "default" | "filled" | "outline";
// Placeholder type is driven by styles; no prop
// Colors are handled via styles; no color props
type BackgroundType = "default" | "neutral" | "surface" | "transparent";
type BorderType =
  | "none"
  | "default"
  | "primary"
  | "selected"
  | "danger"
  | "subtle";

// Error text size is style-driven; no prop to control

type CommonProps = {
  backgroundType?: BackgroundType;
  borderType?: BorderType;
  className?: string;
  error?: boolean;
  errorMessage?: string;
  inputType: "input" | "textarea";
  leftIcon?: ReactNode;
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

export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(
  (
    {
      backgroundType: _backgroundType = "default",
      borderType: _borderType = "default",
      className,
      error,
      errorMessage,
      inputType = "input",
      leftIcon,
      rightIcon,
      size = "medium",
      variant = "default",
      ...nativeProps
    }: InputProps,
    ref,
  ) => {
    const reactGeneratedId = useId();
    const nativeId = (nativeProps as { id?: string }).id;
    const inputId = nativeId ?? `input-${reactGeneratedId}`;
    const hasError = error || !!errorMessage;
    const errorId = `${inputId}-error`;
    const existingDescribedBy = (
      nativeProps as {
        "aria-describedby"?: string;
      }
    )["aria-describedby"];
    const ariaDescribedBy =
      [existingDescribedBy, errorMessage ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;
    const ariaInvalid = hasError || undefined;
    const containerClass = classNames(
      styles.container,
      {
        [styles.error]: hasError,
        [styles["has-left-icon"]]: leftIcon,
        [styles["has-right-icon"]]: rightIcon,
      },
      className,
    );

    const inputClass = classNames(
      inputType === "textarea" ? styles.textarea : styles.input,
      {},
    );

    return (
      <>
        <div className={containerClass} data-size={size} data-variant={variant}>
          {leftIcon && <div className={styles["left-icon"]}>{leftIcon}</div>}
          {inputType === "textarea" ? (
            <textarea
              ref={ref as Ref<HTMLTextAreaElement>}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              className={inputClass}
              {...(nativeProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as Ref<HTMLInputElement>}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              className={inputClass}
              {...(nativeProps as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          {rightIcon && <div className={styles["right-icon"]}>{rightIcon}</div>}
        </div>
        {errorMessage && (
          <div className={styles["error-text"]} id={errorId}>
            {errorMessage}
          </div>
        )}
      </>
    );
  },
);

Input.displayName = "Input";
