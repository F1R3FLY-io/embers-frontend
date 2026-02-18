import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/lib/components/Button";
import { SearchControl } from "@/lib/components/SearchControl";
import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { SortControl } from "@/lib/components/SortControl";
import { Text } from "@/lib/components/Text";
import { ThemeSwitch } from "@/lib/components/ThemeSwitch";
import { useWalletState } from "@/lib/providers/wallet/useApi";
import AgentTeamIcon from "@/public/icons/agentsteam-icon.svg?react";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import DocumentationIcon from "@/public/icons/doc-icon.svg?react";
import GraphicalQueries from "@/public/icons/graphical-query.svg?react";
import LogoutIcon from "@/public/icons/logout-icon.svg?react";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import AgentsTab from "./components/AgentsTab";
import AgentTeamsTab from "./components/AgentTeamsTab";
import GraphicalQueryTab from "./components/GraphicalQueryTab";
import { GroupButton } from "./components/GroupButton";
import styles from "./Dashboard.module.scss";

type SortBy = "date" | "name";

interface TabCommonProps {
  searchQuery: string;
  sortBy: SortBy;
}

export type TabId = "agents" | "agent-teams" | "graphical-query";

interface TabConfig {
  Content: React.ComponentType<TabCommonProps>;
  icon: React.ReactNode;
  id: TabId;
  labelKey: string;
  placeholder: string;
}

const tabs: TabConfig[] = [
  {
    Content: AgentsTab,
    icon: <AgentIcon />,
    id: "agents",
    labelKey: "agents.agents",
    placeholder: "Type to search agents...",
  },
  {
    Content: AgentTeamsTab,
    icon: <AgentTeamIcon />,
    id: "agent-teams",
    labelKey: "agents.agentTeams",
    placeholder: "Type to search agents teams...",
  },
  {
    Content: GraphicalQueryTab,
    icon: <GraphicalQueries />,
    id: "graphical-query",
    labelKey: "oslf.graphQueries",
    placeholder: "Type to search queries...",
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
          <Button icon={<SettingsIcon />} type="gray" />
        </div>
      </div>

      <div className={styles["main-content"]}>
        <div className={styles.dashboard}>
          <div className={styles["dashboard-top"]}>
            {tabs.map((tab) => (
              <GroupButton
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
              </GroupButton>
            ))}
          </div>
          <div className={styles["dashboard-column"]}>
            <div className={styles["dashboard-divider"]} />
            <div className={styles["dashboard-buttons"]}>
              <Button
                className={styles["system-button"]}
                icon={<DocumentationIcon />}
                type="gray"
              >
                {t("dashboard.documentation")}
              </Button>
              <Button
                className={styles["system-button"]}
                icon={<LogoutIcon />}
                type="gray"
                onClick={logout}
              >
                {t("dashboard.logout")}
              </Button>
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
            <Text bold color="primary" type="H2">
              {t(activeTab.labelKey)}
            </Text>

            <div className={styles["controls-row"]}>
              <SortControl sortBy={sortBy} onSortChange={setSortBy} />
              <SearchControl
                className={styles["search-control"]}
                placeholder={activeTab.placeholder}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
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
