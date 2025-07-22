import classNames from "classnames";

import { Text } from "@/lib/components/Text";

import styles from "./Button.module.scss";

type ButtonProps = {
  type: "primary" | "secondary";
  onClick: () => void;
  children?: string;
};

export default function Button({ type, onClick, children }: ButtonProps) {
  const btnClass = classNames(styles.button, {
    [styles.primary]: type === "primary",
    [styles.secondary]: type === "secondary",
  });

  return (
    <button className={btnClass} onClick={onClick}>
      <Text noColour fontSize={14} fontWeight={600}>
        {children ?? ""}
      </Text>
    </button>
  );
}
