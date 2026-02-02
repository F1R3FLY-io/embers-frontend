import type React from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Header.module.scss";

interface HeaderProps {
  actions?: React.ReactNode;
  headerClick?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  actions,
  headerClick,
  title,
}) => {
  return (
    <header className={styles["header-bar"]}>
      <div className={styles["header-content"]}>
        <div
          className={styles["app-title"]}
          onClick={() => (headerClick ? headerClick() : null)}
        >
          <Text color="primary" type="H4">
            {title}
          </Text>
        </div>
        <div className={styles["header-right"]}>
          <div className={styles.actions}>{actions}</div>
        </div>
      </div>
    </header>
  );
};
