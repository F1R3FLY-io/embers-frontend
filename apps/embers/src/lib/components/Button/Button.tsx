import classNames from "classnames";

import { Text } from "@/lib/components/Text";

import styles from "./Button.module.scss";

type ButtonProps = {
  children?: string;
  onClick: () => void;
  type: "primary" | "secondary";
};

export default function Button({ children, onClick, type }: ButtonProps) {
  const btnClass = classNames(styles.button, {
    [styles.primary]: type === "primary",
    [styles.secondary]: type === "secondary",
  });

  return (
    <button className={btnClass} onClick={onClick}>
      <Text fontSize={14} fontWeight={600}>
        {children ?? ""}
      </Text>
    </button>
  );
}
