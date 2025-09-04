import classNames from "classnames";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Text } from "@/lib/components/Text";
import { ThemeSwitch } from "@/lib/components/ThemeSwitch";
import { useWalletState } from "@/lib/providers/wallet/useApi";
import { useAgents } from "@/lib/queries";
import AgentTeamIcon from "@/public/icons/agentsteam-icon.svg?react";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import ChevronIcon from "@/public/icons/chevrondown-icon.svg?react";
import DocumentationIcon from "@/public/icons/doc-icon.svg?react";
import LogoutIcon from "@/public/icons/logout-icon.svg?react";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import { AgentsButton } from "./components/AgentsButton";
import { AgentsGrid } from "./components/AgentsGrid";
import { AgentsTitle } from "./components/AgentsTitle";
import { AgentTeamsGrid } from "./components/AgentTeamsGrid";
import { ControlsRow } from "./components/ControlsRow";
import { IconButton } from "./components/IconButton";
import styles from "./Dashboard.module.scss";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<"agents" | "agent-teams">(
    "agents",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const { setKey } = useWalletState();
  const logout = useCallback(() => setKey(), [setKey]);
  const navigate = useNavigate();
  const createAiAgent = useCallback(() => {
    void navigate("/create-ai-agent");
  }, [navigate]);

  const { data, isSuccess } = useAgents();

  return (
    <div className={styles.page}>
      <div className={styles["header-bar"]}>
        <div className={styles["app-title"]}>
          <Text bold color="primary" type="H4">
            F1R3FLY
          </Text>
        </div>
        <div className={styles["header-right"]}>
          <div className={styles["language-dropdown"]}>
            <select className={styles.dropdown}>
              <option value="en">
                <Text color="secondary" type="normal">English</Text>
              </option>
              <option value="es">
                <Text color="secondary" type="normal">Español</Text>
              </option>
              <option value="fr">
                <Text color="secondary" type="normal">Français</Text>
              </option>
              <option value="de">
                <Text color="secondary" type="normal">Deutsch</Text>
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
            <AgentsButton
              icon={<AgentIcon data-agent />}
              isSelected={selectedTab === "agents"}
              onClick={() => {
                if (selectedTab !== "agents") {
                  setSelectedTab("agents");
                }
              }}
            >
              <Text color="primary" type="large">
                Agents
              </Text>
            </AgentsButton>
            <AgentsButton
              icon={<AgentTeamIcon data-agent-teams />}
              isSelected={selectedTab === "agent-teams"}
              onClick={() => {
                if (selectedTab !== "agent-teams") {
                  setSelectedTab("agent-teams");
                }
              }}
            >
              <Text color="primary" type="large">
                Agent Teams
              </Text>
            </AgentsButton>
          </div>
          <div className={styles["dashboard-column"]}>
            <div className={styles["dashboard-divider"]} />
            <div className={styles["dashboard-buttons"]}>
              <IconButton icon={<DocumentationIcon />}>
                <Text color="primary" type="large">
                  Documentation
                </Text>
              </IconButton>
              <IconButton icon={<LogoutIcon />} onClick={logout}>
                <Text color="primary" type="large">
                  Logout
                </Text>
              </IconButton>
            </div>
          </div>
        </div>
        <div className={styles["content-area"]}>
          <div
            className={classNames(
              styles["content-header"],
              styles["tab-content"]
            )}
          >
            <AgentsTitle
              getTitle={() =>
                selectedTab === "agents" ? "Agents" : "Agent Teams"
              }
            />
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
              styles["tab-content"]
            )}
          >
            {selectedTab === "agents" ? (
              <AgentsGrid agents={data?.agents || []} isSuccess={isSuccess} />
            ) : (
              <AgentTeamsGrid />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
