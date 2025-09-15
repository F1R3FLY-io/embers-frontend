import classNames from "classnames";
import { useId } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./ToggleSwitch.module.scss";

export type ToggleSwitchProps = {
  checked?: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
  name?: string;
  onChange?: (checked: boolean) => void;
};

export function ToggleSwitch({
  checked,
  className,
  disabled,
  label,
  name,
  onChange,
}: ToggleSwitchProps) {
  const id = useId();
  return (
    <label
      className={classNames(
        styles.wrapper,
        disabled && styles.disabled,
        className,
      )}
      htmlFor={id}
    >
      <input
        checked={checked}
        className={styles.input}
        disabled={disabled}
        id={id}
        name={name}
        role="switch"
        type="checkbox"
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span aria-hidden className={styles.track}>
        <span className={styles.thumb} />
      </span>
      {label && <Text type="normal">{label}</Text>}
    </label>
  );
}
