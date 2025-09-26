import classNames from "classnames";

import { Text } from "@/lib/components/Text";

import styles from "./Button.module.scss";

type ButtonProps = {
  children: string;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  rounded?: boolean;
  type: "primary" | "secondary";
};

export function Button({
  children,
  className,
  disabled,
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
    },
    className,
  );

  return (
    <button
      aria-disabled={disabled || undefined}
      className={btnClass}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
    >
      <Text bold type="normal">
        {children}
      </Text>
    </button>
  );
}
