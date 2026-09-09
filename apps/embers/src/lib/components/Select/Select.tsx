import classNames from "classnames";
import { useEffect, useId, useRef, useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Select.module.scss";

export interface Option<T extends string> {
  label: string;
  value: T;
}

interface BaseProps<T extends string> {
  className?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  label?: string;
  name?: string;
  onBlur?: () => void;
  options: Option<T>[];
  placeholder?: string;
  placement?: "auto" | "top" | "bottom";
  variant?: "default" | "compact";
}

interface SingleSelectProps<T extends string> extends BaseProps<T> {
  multiple?: false;
  onChange: (value: T) => void;
  value?: T;
}

interface MultiSelectProps<T extends string> extends BaseProps<T> {
  multiple: true;
  onChange: (value: T[]) => void;
  value?: T[];
}

type SelectProps<T extends string> = SingleSelectProps<T> | MultiSelectProps<T>;

export function Select<T extends string>({
  className,
  disabled,
  error,
  errorMessage,
  helperText,
  label,
  multiple,
  name,
  onBlur,
  onChange,
  options,
  placeholder = "Select value",
  placement = "auto",
  value,
  variant = "default",
}: SelectProps<T>) {
  const errorId = useId();
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (val: T) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(val)) {
        onChange(current.filter((v) => v !== val));
      } else {
        onChange([...current, val]);
      }
    } else {
      onChange(val);
      setOpen(false);
    }
  };

  const isSelected = (val: T) =>
    multiple ? Array.isArray(value) && value.includes(val) : value === val;

  useEffect(() => {
    if (!open) {
      return;
    }

    const decide = () => {
      if (placement === "top") {
        setDropUp(true);
        return;
      }
      if (placement === "bottom") {
        setDropUp(false);
        return;
      }

      const el = triggerRef.current;
      if (!el) {
        return;
      }

      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const estHeight = Math.min(240, Math.max(36, options.length * 36));
      const shouldFlipUp = spaceBelow < estHeight && spaceAbove > spaceBelow;

      setDropUp(shouldFlipUp);
    };

    decide();
    window.addEventListener("resize", decide);
    window.addEventListener("scroll", decide, true);
    return () => {
      window.removeEventListener("resize", decide);
      window.removeEventListener("scroll", decide, true);
    };
  }, [open, placement, options.length]);

  return (
    <div
      className={classNames(styles.container, className, {
        [styles.compact]: variant === "compact",
      })}
    >
      {label && (
        <Text bold color="secondary" type="small">
          {label}
        </Text>
      )}

      <div
        ref={triggerRef}
        aria-describedby={errorMessage ? errorId : undefined}
        aria-expanded={open}
        aria-invalid={error || !!errorMessage || undefined}
        aria-label={label ?? placeholder}
        className={classNames(styles.select, {
          [styles.disabled]: disabled,
          [styles.error]: error || !!errorMessage,
          [styles.open]: open,
          [styles["select-compact"]]: variant === "compact",
        })}
        data-field={name}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        onBlur={() => {
          setOpen(false);
          onBlur?.();
        }}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(!open);
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const current = options.findIndex(
              (option) => option.value === value,
            );
            const next =
              (current +
                (event.key === "ArrowDown" ? 1 : -1) +
                options.length) %
              options.length;
            if (options[next]) {
              handleSelect(options[next].value);
            }
          }
        }}
      >
        <div className={styles.value}>
          {multiple ? (
            Array.isArray(value) && value.length > 0 ? (
              value.map((v) => (
                <span key={v} className={styles.tag}>
                  {options.find((o) => o.value === v)?.label || v}
                </span>
              ))
            ) : (
              <Text className={styles.placeholder} color="primary">
                {placeholder}
              </Text>
            )
          ) : value ? (
            <Text color="primary">
              {options.find((o) => o.value === value)?.label}
            </Text>
          ) : (
            <Text className={styles.placeholder} color="primary">
              {placeholder}
            </Text>
          )}
        </div>
        <div className={styles.arrow}>
          <i className="fa fa-chevron-down" />
        </div>
      </div>

      {open && !disabled && (
        <div className={classNames(styles.dropdown, { [styles.up]: dropUp })}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={classNames(styles.option, {
                [styles.selected]: isSelected(opt.value),
              })}
              onMouseDown={() => handleSelect(opt.value)}
            >
              <Text color="primary">{opt.label}</Text>
            </div>
          ))}
        </div>
      )}

      {errorMessage && (
        <p id={errorId} role="alert">
          {errorMessage}
        </p>
      )}
      {helperText && (
        <Text
          className={classNames({ [styles.error]: error })}
          color="primary"
          type="small"
        >
          {helperText}
        </Text>
      )}
    </div>
  );
}
