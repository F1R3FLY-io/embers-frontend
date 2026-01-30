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

type CommonProps = {
  className?: string;
  error?: boolean | undefined;
  errorMessage?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: InputSize;
  variant?: InputVariant;
};

type InputAsInput = CommonProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    textarea?: false;
  };

type InputAsTextarea = CommonProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    textarea: true;
  };

type InputProps = InputAsInput | InputAsTextarea;

export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(
  (
    {
      className,
      error,
      errorMessage,
      leftIcon,
      rightIcon,
      size = "medium",
      textarea,
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

    return (
      <>
        <div className={containerClass} data-size={size} data-variant={variant}>
          {leftIcon && <div className={styles["left-icon"]}>{leftIcon}</div>}
          {textarea ? (
            <textarea
              ref={ref as Ref<HTMLTextAreaElement>}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              className={styles.textarea}
              {...(nativeProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as Ref<HTMLInputElement>}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              className={styles.input}
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
