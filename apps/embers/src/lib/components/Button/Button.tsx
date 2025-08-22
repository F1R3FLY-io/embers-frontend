import classNames from "classnames";

import { Text } from "@/lib/components/Text";

import styles from "./Button.module.scss";

type ButtonProps = {
  children: string;
  className?: string;
  onClick: () => void;
  type: "primary" | "secondary";
};

export function Button({ children, className, onClick, type }: ButtonProps) {
  const btnClass = classNames(
    styles.button,
    {
      [styles.primary]: type === "primary",
      [styles.secondary]: type === "secondary",
    },
    className,
  );

  return (
    <button className={btnClass} onClick={onClick}>
      <Text bold>{children}</Text>
    </button>
  );
}
