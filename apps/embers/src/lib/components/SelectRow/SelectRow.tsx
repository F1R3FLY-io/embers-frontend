import type React from "react";

import classNames from "classnames";
import { useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./SelectRow.module.scss";

export type SelectRowProps = {
  className?: string;
  defaultSelected?: boolean;
  disabled?: boolean;
  explanation?: string;
  onSelectedChange?: (next: boolean) => void;
  rightAdornment?: React.ReactNode;
  selected?: boolean;
  title: string;
};

export function SelectRow({
  className,
  defaultSelected,
  disabled,
  explanation,
  onSelectedChange,
  rightAdornment,
  selected,
  title,
}: SelectRowProps) {
  const isControlled = typeof selected === "boolean";
  const [localSelected, setLocalSelected] =
    useState<boolean>(!!defaultSelected);
  const isSelected = isControlled ? selected : localSelected;

  const handleClick = () => {
    if (disabled) {
      return;
    }
    const next = !isSelected;
    if (!isControlled) {
      setLocalSelected(next);
    }
    onSelectedChange?.(next);
  };

  return (
    <button
      className={classNames(styles.row, className, {
        [styles.disabled]: disabled,
        [styles.selected]: isSelected,
      })}
      disabled={disabled}
      type="button"
      onClick={handleClick}
    >
      <span className={styles.content}>
        <Text type="normal">{title}</Text>
        {explanation && (
          <Text color="secondary" type="small">
            {explanation}
          </Text>
        )}
      </span>

      <span
        className={classNames(styles.right, {
          [styles["right-visible"]]: isSelected,
        })}
      >
        {rightAdornment ?? <i aria-hidden="true" className="fa fa-check" />}
      </span>
    </button>
  );
}
