import type React from "react";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Select.module.scss";

export interface Option {
  label: string;
  value: string;
}

interface BaseProps {
  className?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  options: Option[];
  placeholder?: string;
  placement?: "auto" | "top" | "bottom"; // NEW
}

interface SingleSelectProps extends BaseProps {
  multiple?: false;
  onChange: (value: string) => void;
  value: string;
}

interface MultiSelectProps extends BaseProps {
  multiple: true;
  onChange: (value: string[]) => void;
  value: string[];
}

type SelectProps = SingleSelectProps | MultiSelectProps;

export const Select: React.FC<SelectProps> = ({
  className,
  disabled,
  error,
  helperText,
  label,
  multiple,
  onChange,
  options,
  placeholder = "Select value",
  placement = "auto",
  value,
}) => {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (val: string) => {
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

  const isSelected = (val: string) =>
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

      // estimate desired menu height (rows * 36px up to 240px)
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
    <div className={classNames(styles.container, className)}>
      {label && (
        <Text bold color="secondary" type="small">
          {label}
        </Text>
      )}

      <div
        ref={triggerRef}
        className={classNames(styles.select, {
          [styles.disabled]: disabled,
          [styles.error]: error,
          [styles.open]: open,
        })}
        tabIndex={0}
        onBlur={() => setOpen(false)}
        onClick={() => !disabled && setOpen((prev) => !prev)}
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
};
