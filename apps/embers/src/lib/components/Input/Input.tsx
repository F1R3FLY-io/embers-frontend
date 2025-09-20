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
  errorText?: string;
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

export function Input({
  backgroundType = "default",
  borderType = "default",
  className,
  error,
  errorMessage,
  errorText,
  inputType = "input",
  leftIcon,
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
      // error visuals handled via ARIA in CSS
      [styles["has-left-icon"]]: leftIcon,
      [styles["has-right-icon"]]: rightIcon,
    },
    className,
  );

  const inputClass = classNames(
    inputType === "textarea" ? styles.textarea : styles.input,
    {
    },
  );

  return (
    <>
      <div className={containerClass} data-size={size} data-variant={variant}>
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
        <div className={classNames(styles["error-text"], styles["error-text-danger"]) } id={errorId}>
          {message}
        </div>
      )}
    </>
  );
}
