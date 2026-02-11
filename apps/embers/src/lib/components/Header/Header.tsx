import type React from "react";

import classNames from "classnames";

import { Text } from "@/lib/components/Text";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import styles from "./Header.module.scss";

interface HeaderProps {
  actions?: React.ReactNode;
  onBackClick: () => void;
  onSettingsClick: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({
  actions,
  onBackClick,
  onSettingsClick,
  title,
}) => {
  return (
    <header className={styles["header-bar"]}>
      <div className={styles["header-content"]}>
        <div className={styles["app-title"]}>
          <div
            className={classNames("fa", "fa-arrow-left", styles.cursor)}
            onClick={onBackClick}
          />
          <Text color="primary" type="H4">
            {title}
          </Text>
          <SettingsIcon
            className={styles["settings-icon"]}
            onClick={onSettingsClick}
          />
        </div>
        <div className={styles["header-right"]}>
          <div className={styles.actions}>{actions}</div>
        </div>
      </div>
    </header>
  );
};
