import { type ReactNode } from "react";

import logo from "@/public/icons/firefly-io.png";

import styles from "./ContainerWithLogo.module.scss";

type ContainerWithLogoProp = {
  children: ReactNode;
};

export default function ContainerWithLogo({ children }: ContainerWithLogoProp) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <img className={styles.logo} src={logo} />
        {children}
      </div>
    </div>
  );
}
