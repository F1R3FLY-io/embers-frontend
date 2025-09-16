import type React from "react";

import classNames from "classnames";

import { Text } from "@/lib/components/Text";

import styles from "./Tag.module.scss";

export type TagProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClose?: () => void;
  selected?: boolean;
  variant?: "solid" | "soft" | "outline";
};

export function Tag({
  children,
  className,
  disabled,
  onClose,
  selected,
  variant = "soft",
}: TagProps) {
  return (
    <span
      className={classNames(
        styles.tag,
        styles[variant],
        {
          [styles.disabled]: disabled,
          [styles.selected]: selected,
        },
        className,
      )}
    >
      <Text className={styles.label} type="normal">
        {children}
      </Text>

      {onClose && (
        <button
          aria-label="Remove tag"
          className={styles.closeBtn}
          type="button"
          onClick={onClose}
        >
          <i className="fa fa-close" />
        </button>
      )}
    </span>
  );
}
