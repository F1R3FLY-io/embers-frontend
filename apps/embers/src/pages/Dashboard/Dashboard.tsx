import classNames from "classnames";
import { useCallback, useState } from "react";

import { Text } from "@/lib/components/Text";
import { ThemeSwitch } from "@/lib/components/ThemeSwitch";
import { useWalletState } from "@/lib/providers/wallet/useApi";
import { useAgents } from "@/lib/queries";
import AgentTeamIcon from "@/public/icons/agentsteam-icon.svg?react";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import ChevronIcon from "@/public/icons/chevrondown-icon.svg?react";
import DocumentationIcon from "@/public/icons/doc-icon.svg?react";
import LogoutIcon from "@/public/icons/logout-icon.svg?react";
import SearchIcon from "@/public/icons/search-light-line-icon.svg?react";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";
import SortIcon from "@/public/icons/sort-icon.svg?react";

import styles from "./Dashboard.module.scss";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<"agents" | "agent-teams">(
    "agents",
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
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
                selectedTab === "agents" && styles.selected,
              )}
              onClick={() => {
                if (selectedTab !== "agents") {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setSelectedTab("agents");
                    setIsTransitioning(false);
                  }, 150);
                }
              }}
            >
              <AgentIcon data-agent />
              <Text bold color="primary" type="H4">
                Agents
              </Text>
            </button>
            <button
              className={classNames(
                styles["icon-button"],
                styles["agents-button"],
                selectedTab === "agent-teams" && styles.selected,
              )}
              onClick={() => {
                if (selectedTab !== "agent-teams") {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setSelectedTab("agent-teams");
                    setIsTransitioning(false);
                  }, 150);
                }
              }}
            >
              <AgentTeamIcon data-agent-teams />
              <Text color="primary" type="H4">
                Agent Teams
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
          <div
            className={classNames(
              styles["content-header"],
              styles["tab-content"],
              isTransitioning ? styles.entering : styles.entered,
            )}
          >
            <Text bold color="primary" type="H2">
              {selectedTab === "agents" ? "Agents" : "Agent Teams"}
            </Text>
            <div className={styles["controls-row"]}>
              <div className={styles["sort-control"]}>
                <SortIcon className={styles["sort-icon"]} />
                <Text color="primary" type="H4">
                  Sort {selectedTab === "agents" ? "agents" : "agent teams"} by
                </Text>
                <div className={styles["sort-dropdown"]}>
                  <select
                    className={styles.dropdown}
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "date" | "name")
                    }
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                  </select>
                  <ChevronIcon className={styles.chevron} />
                </div>
              </div>
              <div className={styles["search-control"]}>
                <div className={styles["search-input-container"]}>
                  <SearchIcon className={styles["search-icon"]} />
                  <input
                    className={styles["search-input"]}
                    placeholder={`Type to search ${selectedTab === "agents" ? "agents" : "agent teams"}...`}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            className={classNames(
              styles["grid-container"],
              styles["tab-content"],
              isTransitioning ? styles.entering : styles.entered,
            )}
          >
            {selectedTab === "agents" ? (
              <>
                <div
                  className={classNames(
                    styles["grid-box"],
                    styles["create-box"],
                  )}
                  style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
                >
                  <AgentIcon className={styles["create-robot-icon"]} />
                  <Text color="secondary" type="H4">
                    Create new Agent
                  </Text>
                </div>
                {isSuccess &&
                  data.agents.map((agent, index) => (
                    <div
                      key={agent.id}
                      className={styles["grid-box"]}
                      style={
                        {
                          "--tile-delay": `${0.2 + index * 0.1}s`,
                        } as React.CSSProperties
                      }
                    >
                      <Text color="secondary" type="H4">
                        Agent {agent.name}
                      </Text>
                    </div>
                  ))}
              </>
            ) : (
              <>
                <div
                  className={classNames(
                    styles["grid-box"],
                    styles["create-box"],
                  )}
                  style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
                >
                  <AgentIcon className={styles["create-robot-icon"]} />
                  <Text color="secondary" type="H4">
                    Create new Agent Team
                  </Text>
                </div>
                {Array.from({ length: 0 }, (_, index) => (
                  <div
                    key={index + 1}
                    className={styles["grid-box"]}
                    style={
                      {
                        "--tile-delay": `${0.2 + index * 0.1}s`,
                      } as React.CSSProperties
                    }
                  >
                    <Text color="secondary" type="H4">
                      {`Agent Team ${index + 1}`}
                    </Text>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
