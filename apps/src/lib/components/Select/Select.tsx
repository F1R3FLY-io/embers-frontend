import classNames from "classnames";
import type React from "react";
import { useState } from "react";

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
  value,
}) => {
  const [open, setOpen] = useState(false);

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

  return (
    <div className={classNames(styles.container, className)}>
      {label && (
        <Text bold color="secondary" type="small">
          {label}
        </Text>
      )}

      <div
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
            <Text color="primary">{options.find((o) => o.value === value)?.label}</Text>
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
        <div className={styles.dropdown}>
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
          className={classNames({
            [styles.error]: error,
          })}
          color="primary"
          type="small"
        >
          {helperText}
        </Text>
      )}
    </div>
  );
};
