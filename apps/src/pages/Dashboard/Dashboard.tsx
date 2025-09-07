import type { AgentHeader } from "@f1r3fly-io/embers-client-sdk";

import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { LanguageSelect } from "@/lib/components/Select/LanguageSelect/LanguageSelect";
import { Text } from "@/lib/components/Text";
import { ThemeSwitch } from "@/lib/components/ThemeSwitch";
import { useWalletState } from "@/lib/providers/wallet/useApi";
import { useAgents } from "@/lib/queries";
import RobotIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import DocumentationIcon from "@/public/icons/doc-icon.svg?react";
import LogoutIcon from "@/public/icons/logout-icon.svg?react";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import styles from "./Dashboard.module.scss";

interface AgentsResponse {
  agents: AgentHeader[];
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { setKey } = useWalletState();
  const logout = useCallback(() => setKey(), [setKey]);
  const navigate = useNavigate();
  const createAiAgent = useCallback(() => {
    void navigate("/create-ai-agent");
  }, [navigate]);

  const { data, isSuccess } = useAgents();

  const agents: AgentHeader[] =
    isSuccess && data && typeof data === "object" && "agents" in data
      ? (data as AgentsResponse).agents
      : [];

  return (
    <div className={styles.page}>
      <div className={styles["header-bar"]}>
        <div className={styles["app-title"]}>
          <Text bold color="primary" type="H4">
            {t("f1r3fly")}
          </Text>
        </div>
        <div className={styles["header-right"]}>
          <LanguageSelect />
          <ThemeSwitch />
          <button className={styles["settings-icon"]}>
            <SettingsIcon />
          </button>
        </div>
      </div>
      <div className={styles["main-content"]}>
        <div className={styles.dashboard}>
          <div className={styles["dashboard-top"]}>
            <button className={classNames(styles["icon-button"], styles["agents-button"])}>
              <RobotIcon />
              <Text bold color="primary" type="large">
                {t("agents.agents")}
              </Text>
            </button>
          </div>
          <div className={styles["dashboard-column"]}>
            <div className={styles["dashboard-divider"]} />
            <div className={styles["dashboard-buttons"]}>
              <button className={styles["icon-button"]}>
                <DocumentationIcon />
                <Text color="primary" type="large">
                  {t("dashboard.documentation")}
                </Text>
              </button>
              <button className={styles["icon-button"]} onClick={logout}>
                <LogoutIcon />
                <Text color="primary" type="large">
                  {t("dashboard.logout")}
                </Text>
              </button>
            </div>
          </div>
        </div>
        <div className={styles["content-area"]}>
          <div className={styles["content-header"]}>
            <Text bold color="primary" type="H2">
              {t("agents.agents")}
            </Text>
          </div>
          <div className={styles["grid-container"]}>
            <div
              className={classNames(styles["grid-box"], styles["create-box"])}
              onClick={createAiAgent}
            >
              <RobotIcon className={styles["create-robot-icon"]} />
              <Text color="secondary" type="large">
                {t("agents.createNewAgent")}
              </Text>
            </div>
            {agents.map((agent: AgentHeader) => (
              <div key={agent.id} className={styles["grid-box"]}>
                <Text color="secondary" type="large">
                  {t("agents.agentWithName", { name: agent.name })}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
