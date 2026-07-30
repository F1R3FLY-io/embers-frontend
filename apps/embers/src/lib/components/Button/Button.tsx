import type React from "react";

import classNames from "classnames";

import { Text } from "@/lib/components/Text";

import styles from "./Button.module.scss";

type ButtonProps = {
  /** Accessible name. Required in practice for an icon-only button, whose
   * glyph gives a screen reader nothing to announce. */
  ariaLabel?: string;
  children?: string;
  className?: string;
  disabled?: boolean;
  expanded?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void | Promise<void>;
  rounded?: boolean;
  submit?: boolean;
  type: "primary" | "secondary" | "subtle" | "gray";
};

export function Button({
  ariaLabel,
  children,
  className,
  disabled,
  expanded,
  icon,
  onClick,
  rounded,
  submit,
  type,
}: ButtonProps) {
  const btnClass = classNames(
    styles.button,
    {
      [styles.disabled]: disabled,
      [styles.gray]: type === "gray",
      [styles.primary]: type === "primary",
      [styles.rounded]: rounded,
      [styles.secondary]: type === "secondary",
      [styles.subtle]: type === "subtle",
    },
    className,
  );

  return (
    <button
      aria-disabled={disabled || undefined}
      aria-expanded={expanded}
      aria-haspopup={expanded === undefined ? undefined : "menu"}
      aria-label={ariaLabel}
      className={btnClass}
      disabled={disabled}
      type={submit ? "submit" : "button"}
      onClick={() => {
        if (!disabled && onClick) {
          void onClick();
        }
      }}
    >
      {icon ? (
        <div
          className={classNames(styles.icon, { [styles.textless]: !children })}
        >
          {icon}
        </div>
      ) : null}
      {children && (
        <Text bold type="normal">
          {children}
        </Text>
      )}
    </button>
  );
}
