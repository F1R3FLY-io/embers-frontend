import type { ReactNode } from "react";

import logo from "@/public/firefly-io.png";

import styles from "./ContainerWithLogo.module.scss";

type ContainerWithLogoProp = {
  children: ReactNode;
};

export default function ContainerWithLogo({ children }: ContainerWithLogoProp) {
  return (
    <div className={styles.container}>
      <img className={styles.logo} src={logo} />
      <div>{children}</div>
    </div>
  );
}
