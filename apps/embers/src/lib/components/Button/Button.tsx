import type React from "react";

import classNames from "classnames";

import { Text } from "@/lib/components/Text";

import styles from "./Button.module.scss";

type ButtonProps = {
  children?: string;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
  rounded?: boolean;
  type: "primary" | "secondary" | "subtle";
};

export function Button({
  children,
  className,
  disabled,
  icon,
  onClick,
  rounded,
  type,
}: ButtonProps) {
  const btnClass = classNames(
    styles.button,
    {
      [styles.disabled]: disabled,
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
      className={btnClass}
      type="button"
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
    >
      {icon ? <div className={classNames(styles.icon, {[styles.textless]: !children})}>{icon}</div> : null}
      {children &&
        <Text bold type="normal">
          {children}
        </Text>
      }
    </button>
  );
}
