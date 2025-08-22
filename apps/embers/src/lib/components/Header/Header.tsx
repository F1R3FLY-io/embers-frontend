import type React from "react";

import { Text } from "@/lib/components/Text";
import { useLayout } from "@/lib/providers/layout/useLayout.ts";

import styles from "./Header.module.scss";

interface HeaderProps {
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ actions }) => {
  const { headerTitle } = useLayout();
  return (
    <header className={styles["header-bar"]}>
      <div className={styles["header-content"]}>
        <div className={styles["app-title"]}>
          <Text fontSize={24} type="title">
            {headerTitle}
          </Text>
        </div>
        <div className={styles["header-right"]}>
          <div className={styles.actions}>{actions}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
