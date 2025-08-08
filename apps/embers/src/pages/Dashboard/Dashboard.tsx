import { useState } from "react";
import { Text } from "@/lib/components/Text";
import { ThemeSwitch } from "@/lib/components/ThemeSwitch";
import ChevronIcon from "@/public/icons/old_icon_components/chevron-icon";
import DocumentationIcon from "@/public/icons/old_icon_components/documentation-icon";
import LogoutIcon from "@/public/icons/old_icon_components/logout-icon";
import AgentIcon from "@/public/icons/agent-icon.svg?react";
import AgentTeamIcon from "@/public/icons/agent-team-icon.svg?react";
import RobotIcon from "@/public/icons/old_icon_components/robot-icon";
import SettingsIcon from "@/public/icons/old_icon_components/settings-icon";

import styles from "./Dashboard.module.scss";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<"agents" | "agent-teams">("agents");
  const [isTransitioning, setIsTransitioning] = useState(false);
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
              className={`${styles["icon-button"]} ${styles["agents-button"]} ${
                selectedTab === "agents" ? styles.selected : ""
              }`}
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
              <AgentIcon />
              <Text fontSize={14}>Agents</Text>
            </button>
            <button
              className={`${styles["icon-button"]} ${styles["agents-button"]} ${
                selectedTab === "agent-teams" ? styles.selected : ""
              }`}
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
              <AgentTeamIcon />
              <Text fontSize={14}>Agent Teams</Text>
            </button>
          </div>
          <div className={styles["dashboard-column"]}>
            <div className={styles["dashboard-divider"]}></div>
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
          <div className={`${styles["content-header"]} ${styles["tab-content"]} ${isTransitioning ? styles.entering : styles.entered}`}>
            <Text fontSize={26} type="title">
              {selectedTab === "agents" ? "Agents" : "Agent Teams"}
            </Text>
          </div>
          <div className={`${styles["grid-container"]} ${styles["tab-content"]} ${isTransitioning ? styles.entering : styles.entered}`}>
            {selectedTab === "agents" ? (
              <>
                <div 
                  className={`${styles["grid-box"]} ${styles["create-box"]}`}
                  style={{ '--tile-delay': '0.1s' } as React.CSSProperties}
                >
                  <div className={styles["create-robot-icon"]}>
                    <RobotIcon />
                  </div>
                  <Text type="secondary">Create new Agent</Text>
                </div>
                {Array.from({ length: 0 }, (_, index) => (
                  <div 
                    key={index + 1} 
                    className={styles["grid-box"]}
                    style={{ '--tile-delay': `${0.2 + index * 0.1}s` } as React.CSSProperties}
                  >
                    <Text type="secondary">{`Agent ${index + 2}`}</Text>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div 
                  className={`${styles["grid-box"]} ${styles["create-box"]}`}
                  style={{ '--tile-delay': '0.1s' } as React.CSSProperties}
                >
                  <div className={styles["create-robot-icon"]}>
                    <RobotIcon />
                  </div>
                  <Text type="secondary">Create new Agent Team</Text>
                </div>
                {Array.from({ length: 10 }, (_, index) => (
                  <div 
                    key={index + 1} 
                    className={styles["grid-box"]}
                    style={{ '--tile-delay': `${0.2 + index * 0.1}s` } as React.CSSProperties}
                  >
                    <Text type="secondary">{`Agent Team ${index + 2}`}</Text>
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
