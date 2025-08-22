import classNames from "classnames";
import { useCallback } from "react";

import { Text } from "@/lib/components/Text";
import { ThemeSwitch } from "@/lib/components/ThemeSwitch";
import { useWalletState } from "@/lib/providers/wallet/useApi";
import { useAgents } from "@/lib/queries";
import RobotIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import ChevronIcon from "@/public/icons/chevrondown-icon.svg?react";
import DocumentationIcon from "@/public/icons/doc-icon.svg?react";
import LogoutIcon from "@/public/icons/logout-icon.svg?react";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import styles from "./Dashboard.module.scss";

export default function Dashboard() {
  const { setKey } = useWalletState();
  const logout = useCallback(() => setKey(), [setKey]);

  const { data, isSuccess } = useAgents();

  return (
    <div className={styles.page}>
      <div className={styles["header-bar"]}>
        <div className={styles["app-title"]}>
          <Text bold color="primary" type="H3">
            F1R3FLY
          </Text>
        </div>
        <div className={styles["header-right"]}>
          <div className={styles["language-dropdown"]}>
            <select className={styles.dropdown}>
              <option value="en">
                <Text color="secondary">English</Text>
              </option>
              <option value="es">
                <Text color="secondary">Español</Text>
              </option>
              <option value="fr">
                <Text color="secondary">Français</Text>
              </option>
              <option value="de">
                <Text color="secondary">Deutsch</Text>
              </option>
            </select>
            <ChevronIcon className={styles.chevron} />
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
              <RobotIcon />
              <Text bold color="primary" type="H4">
                Agents
              </Text>
            </button>
          </div>
          <div className={styles["dashboard-column"]}>
            <div className={styles["dashboard-divider"]} />
            <div className={styles["dashboard-buttons"]}>
              <button className={styles["icon-button"]}>
                <DocumentationIcon />
                <Text color="primary" type="H4">
                  Documentation
                </Text>
              </button>
              <button className={styles["icon-button"]} onClick={logout}>
                <LogoutIcon />
                <Text color="primary" type="H4">
                  Logout
                </Text>
              </button>
            </div>
          </div>
        </div>
        <div className={styles["content-area"]}>
          <div className={styles["content-header"]}>
            <Text bold color="primary" type="H2">
              Agents
            </Text>
          </div>
          <div className={styles["grid-container"]}>
            <div
              className={classNames(styles["grid-box"], styles["create-box"])}
            >
              <RobotIcon className={styles["create-robot-icon"]} />
              <Text color="secondary" type="H4">
                Create new Agent
              </Text>
            </div>
            {isSuccess &&
              data.agents.map((agent) => (
                <div key={agent.id} className={styles["grid-box"]}>
                  <Text color="secondary" type="H4">
                    Agent {agent.name}
                  </Text>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
