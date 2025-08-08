import classNames from "classnames";

import { Text } from "@/lib/components/Text";
import { ThemeSwitch } from "@/lib/components/ThemeSwitch";
import ChevronIcon from "@/public/icons/icon_components/chevron-icon";
import DocumentationIcon from "@/public/icons/icon_components/documentation-icon";
import LogoutIcon from "@/public/icons/icon_components/logout-icon";
import RobotIcon from "@/public/icons/aiagent.svg?react";
import SettingsIcon from "@/public/icons/icon_components/settings-icon";
import SmallRobotIcon from "@/public/icons/icon_components/small-robot-icon";

import styles from "./Dashboard.module.scss";

export default function Dashboard() {
  return (
    <div className={styles.page}>
      <div className={styles["header-bar"]}>
        <div className={styles["app-title"]}>
          <Text fontSize={18} type="title">
            F1R3FLY
          </Text>
        </div>
        <div className={styles["header-right"]}>
          <div className={styles["language-dropdown"]}>
            <select className={styles.dropdown}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
            <div className={styles.chevron}>
              <ChevronIcon />
            </div>
          </div>
          <ThemeSwitch />
          <button className={styles["settings-icon"]}>
            <SettingsIcon />
          </button>
        </div>
      </div>
      <div className={styles["main-content"]}>
        <div className={styles.dashboard}>
          <div className={styles["dashboard-top"]}>
            <button
              className={classNames(
                styles["icon-button"],
                styles["agents-button"],
              )}
            >
              <SmallRobotIcon />
              <Text fontSize={14}>Agents</Text>
            </button>
          </div>
          <div className={styles["dashboard-column"]}>
            <div className={styles["dashboard-divider"]} />
            <div className={styles["dashboard-buttons"]}>
              <button className={styles["icon-button"]}>
                <DocumentationIcon />
                <Text fontSize={14}>Documentation</Text>
              </button>
              <button className={styles["icon-button"]}>
                <LogoutIcon />
                <Text fontSize={14}>Logout</Text>
              </button>
            </div>
          </div>
        </div>
        <div className={styles["content-area"]}>
          <div className={styles["content-header"]}>
            <Text fontSize={26} type="title">
              Agents
            </Text>
          </div>
          <div className={styles["grid-container"]}>
            <div
              className={classNames(styles["grid-box"], styles["create-box"])}
            >
              <div className={styles["create-robot-icon"]}>
                <RobotIcon />
              </div>
              <Text type="secondary">Create new Agent</Text>
            </div>
            {Array.from({ length: 0 }, (_, index) => (
              <div key={index + 1} className={styles["grid-box"]}>
                <Text type="secondary">{`Agent ${index + 2}`}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
