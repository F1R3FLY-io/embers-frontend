import type React from "react";

import classNames from "classnames";
import { useEffect, useId, useRef, useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Checkbox.module.scss";

type TriState = "unchecked" | "checked" | "mixed";

type CheckboxProps = {
  checked?: boolean;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  explanation?: string;
  indeterminate?: boolean;
  label?: string;
  onChange?: (checked: boolean) => void;
  onStateChange?: (state: TriState) => void;
  size?: "sm" | "md" | "lg";
  triState?: boolean;
};

export function Checkbox({
  checked,
  className,
  disabled,
  error,
  explanation,
  indeterminate,
  label,
  onChange,
  onStateChange,
  size = "md",
  triState,
}: CheckboxProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [localState, setLocalState] = useState<TriState>(() => {
    if (triState) {
      return indeterminate ? "mixed" : checked ? "checked" : "unchecked";
    }
    return "unchecked";
  });

  const isMixed = triState
    ? localState === "mixed"
    : !!indeterminate && !checked;
  const isChecked = triState ? localState === "checked" : !!checked;

  const isControlled = !!triState || typeof checked === "boolean";

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = isMixed;
    }
  }, [isMixed]);

  useEffect(() => {
    if (
      triState &&
      (typeof checked === "boolean" || typeof indeterminate === "boolean")
    ) {
      setLocalState(
        checked ? "checked" : indeterminate ? "mixed" : "unchecked",
      );
    }
  }, [triState, checked, indeterminate]);

  const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (!triState || disabled) {return;}
    e.preventDefault();
    const next: TriState =
      localState === "mixed"
        ? "checked"
        : localState === "checked"
          ? "unchecked"
          : "mixed";
    setLocalState(next);
    onStateChange?.(next);
    onChange?.(next === "checked");
    inputRef.current?.focus();
  };

  return (
    <label
      className={classNames(
        styles.wrapper,
        styles[size],
        disabled && styles.disabled,
        error && styles.error,
        className,
      )}
      htmlFor={id}
      onClick={handleLabelClick}
    >
      <input
        ref={inputRef}
        aria-checked={isMixed ? "mixed" : undefined}
        className={styles.input}
        disabled={disabled}
        id={id}
        type="checkbox"
        {...(isControlled ? { checked: isChecked } : {})}
        onChange={(e) => {
          if (!triState) {
            onChange?.(e.target.checked);
          }
        }}
      />

      <span
        aria-hidden
        className={classNames(
          styles.box,
          isMixed && styles.indeterminateBox,
          isChecked && styles.checkedBox,
        )}
      >
        <svg
          aria-hidden="true"
          className={styles.icon}
          focusable="false"
          viewBox="0 0 20 20"
        >
          {isMixed ? (
            <rect height="2" rx="1" width="12" x="4" y="9" />
          ) : (
            <path
              d="M5 10.5l3 3 7-7"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          )}
        </svg>
      </span>

      {(label || explanation) && (
        <span className={styles.texts}>
          {label && <Text>{label}</Text>}
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
