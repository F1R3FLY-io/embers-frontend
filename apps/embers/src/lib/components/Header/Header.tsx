import type React from "react";

import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { Text } from "@/lib/components/Text";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import styles from "./Header.module.scss";

interface HeaderProps {
  actions?: React.ReactNode;
  onBackClick: () => void;
  onSettingsClick?: () => void;
  title: string;
}

/**
 * The editor's title bar: leave, rename, and whatever actions the editor adds.
 *
 * Both controls are real buttons with names. They were click-handling `div`s,
 * which meant the only way out of an editor could not be reached by keyboard
 * and announced nothing to a screen reader -- an icon with no text is
 * invisible to anyone not looking at it. Nothing about the appearance depends
 * on the element being a `div`, so the markup is simply the honest one.
 */
export const Header: React.FC<HeaderProps> = ({
  actions,
  onBackClick,
  onSettingsClick,
  title,
}) => {
  const { t } = useTranslation();

  return (
    <header className={styles["header-bar"]}>
      <div className={styles["header-content"]}>
        <div className={styles["app-title"]}>
          <button
            aria-label={t("publish.backToDashboard")}
            className={classNames(styles["icon-button"], styles.cursor)}
            type="button"
            onClick={onBackClick}
          >
            <i aria-hidden className={classNames("fa", "fa-arrow-left")} />
          </button>
          <Text color="primary" type="H4">
            {title}
          </Text>
          {onSettingsClick ? (
            <button
              aria-label={t("agents.generalSettings")}
              className={styles["icon-button"]}
              type="button"
              onClick={onSettingsClick}
            >
              <SettingsIcon className={styles["settings-icon"]} />
            </button>
          ) : null}
        </div>
        <div className={styles["header-right"]}>
          <div className={styles.actions}>{actions}</div>
        </div>
      </div>
    </header>
  );
};
