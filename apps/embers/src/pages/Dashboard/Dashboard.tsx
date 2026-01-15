import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { Text } from "@/lib/components/Text";
import { ThemeSwitch } from "@/lib/components/ThemeSwitch";
import { useWalletState } from "@/lib/providers/wallet/useApi";
import AgentsTab from "@/pages/Dashboard/tabs/AgentsTab";
import AgentTeamsTab from "@/pages/Dashboard/tabs/AgentTeamsTab";
import AgentTeamIcon from "@/public/icons/agentsteam-icon.svg?react";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import DocumentationIcon from "@/public/icons/doc-icon.svg?react";
import LogoutIcon from "@/public/icons/logout-icon.svg?react";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import { AgentsButton } from "./components/AgentsButton";
import { AgentsTitle } from "./components/AgentsTitle";
import { ControlsRow } from "./components/ControlsRow";
import { IconButton } from "./components/IconButton";
import styles from "./Dashboard.module.scss";

type SortBy = "date" | "name";

interface TabCommonProps {
  searchQuery: string;
  sortBy: SortBy;
}

type TabId = "agents" | "agent-teams";

interface TabConfig {
  Content: React.ComponentType<TabCommonProps>;
  icon: React.ReactNode;
  id: TabId;
  labelKey: string;
}

const tabs: TabConfig[] = [
  {
    Content: AgentsTab,
    icon: <AgentIcon data-agent />,
    id: "agents",
    labelKey: "agents.agents",
  },
  {
    Content: AgentTeamsTab,
    icon: <AgentTeamIcon data-agent-teams />,
    id: "agent-teams",
    labelKey: "agents.agentTeams",
  },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const { setKey } = useWalletState();
  const logout = useCallback(() => setKey(), [setKey]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [selectedTab, setSelectedTab] = useState<TabId>(() => {
    return localStorage.getItem("dashboard_tab") as TabId;
  });

  const handleTabChange = useCallback((tabId: TabId) => {
    setSelectedTab(tabId);
    localStorage.setItem("dashboard_tab", tabId);
  }, []);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === selectedTab) ?? tabs[0],
    [selectedTab],
  );

  const ActiveContent = activeTab.Content;

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
            {tabs.map((tab) => (
              <AgentsButton
                key={tab.id}
                icon={tab.icon}
                isSelected={selectedTab === tab.id}
                onClick={() => {
                  if (selectedTab !== tab.id) {
                    handleTabChange(tab.id);
                  }
                }}
              >
                <Text color="secondary" type="large">
                  {t(tab.labelKey)}
                </Text>
              </AgentsButton>
            ))}
          </div>
          <div className={styles["dashboard-column"]}>
            <div className={styles["dashboard-divider"]} />
            <div className={styles["dashboard-buttons"]}>
              <IconButton icon={<DocumentationIcon />}>
                <Text color="primary" type="large">
                  {t("dashboard.documentation")}
                </Text>
              </IconButton>
              <IconButton icon={<LogoutIcon />} onClick={logout}>
                <Text color="primary" type="large">
                  {t("dashboard.logout")}
                </Text>
              </IconButton>
            </div>
          </div>
        </div>

        <div className={styles["content-area"]}>
          <div
            className={classNames(
              styles["content-header"],
              styles["tab-content"],
            )}
          >
            <AgentsTitle getTitle={() => t(activeTab.labelKey)} />
            <ControlsRow
              searchQuery={searchQuery}
              selectedTab={selectedTab}
              sortBy={sortBy}
              onSearchChange={setSearchQuery}
              onSortChange={setSortBy}
            />
          </div>

          <div
            className={classNames(
              styles["grid-container"],
              styles["tab-content"],
            )}
          >
            <ActiveContent searchQuery={searchQuery} sortBy={sortBy} />
          </div>
        </div>
      </div>
    </div>
  );
}
