import type React from "react";

import { Text } from "@/lib/components/Text";
import { useLayout } from "@/lib/providers/layout/useLayout";

import styles from "./Header.module.scss";

interface HeaderProps {
  actions?: React.ReactNode;
  headerClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ actions, headerClick }) => {
  const { headerTitle } = useLayout();

  return (
    <header className={styles["header-bar"]}>
      <div className={styles["header-content"]}>
        <div
          className={styles["app-title"]}
          onClick={() => (headerClick ? headerClick() : null)}
        >
          <Text color="primary" type="H4">
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
