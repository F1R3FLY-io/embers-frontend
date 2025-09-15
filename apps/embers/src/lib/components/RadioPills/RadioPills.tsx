import classNames from "classnames";

import { Text } from "@/lib/components/Text";

import styles from "./RadioPills.module.scss";

export type RadioPillOption = { label: string; value: string };

export type RadioPillsProps = {
  bordered?: boolean;
  className?: string;
  name: string;
  onChange?: (value: string) => void;
  options: RadioPillOption[];
  value?: string;
};

export function RadioPills({
  bordered = true,
  className,
  name,
  onChange,
  options,
  value,
}: RadioPillsProps) {
  return (
    <div className={classNames(styles.group, className)}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={classNames(styles.pill, {
            [styles.bordered]: bordered,
          })}
        >
          <input
            checked={value === opt.value}
            name={name}
            type="radio"
            value={opt.value}
            onChange={() => onChange?.(opt.value)}
          />
          <Text
            className={classNames(
              styles.body,
              value === opt.value && styles.active,
            )}
            type="normal"
          >
            {opt.label}
          </Text>
        </label>
      ))}
    </div>
  );
}
