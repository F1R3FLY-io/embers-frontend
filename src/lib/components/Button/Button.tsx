import classNames from "classnames";

import styles from "./Button.module.scss";

type ButtonProps = {
  type: "primary" | "secondary";
  onClick: () => void;
};

export default function Button({ type, onClick }: ButtonProps) {
  const btnClass = classNames({
    [styles.primary]: type === "primary",
    [styles.secondary]: type === "secondary",
  });

  return (
    <button className={btnClass} onClick={onClick}>
      Click me!
    </button>
  );
}
