import classNames from "classnames";
import { useId } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Radio.module.scss";

export type RadioProps = {
  checked?: boolean;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  explanation?: string;
  label?: string;
  name: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md" | "lg";
  value: string;
};

export function Radio({
  checked,
  className,
  disabled,
  error,
  explanation,
  label,
  name,
  onChange,
  size = "md",
  value,
}: RadioProps) {
  const id = useId();
  const isControlled = typeof checked === "boolean";

  const sizeClass: Record<"sm" | "md" | "lg", string> = {
    lg: styles.lg,
    md: styles.md,
    sm: styles.sm,
  };

  return (
    <label
      className={classNames(styles.wrapper, sizeClass[size], className, {
        [styles.disabled]: disabled,
        [styles.error]: error,
      })}
      htmlFor={id}
    >
      <input
        className={styles.input}
        disabled={disabled}
        id={id}
        name={name}
        type="radio"
        value={value}
        {...(isControlled ? { checked } : {})}
        onChange={(e) => e.target.checked && onChange?.(value)}
      />
      <span aria-hidden className={styles.dot} />
      {(label || explanation) && (
        <span className={styles.texts}>
          {label && <Text type="normal">{label}</Text>}
          {explanation && (
            <Text color="secondary" type="small">
              {explanation}
            </Text>
          )}
        </span>
      )}
    </label>
  );
}
