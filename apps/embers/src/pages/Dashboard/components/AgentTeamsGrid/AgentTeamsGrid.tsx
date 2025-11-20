import type { AgentsTeams } from "@f1r3fly-io/embers-client-sdk";

import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Text } from "@/lib/components/Text";
import AgentTeamIcon from "@/public/icons/agentsteam-icon.svg?react";

import styles from "./AgentTeamsGrid.module.scss";

interface AgentTeamsGridProps {
  agents: AgentsTeams | undefined;
  isSuccess: boolean;
}

export function AgentTeamsGrid({ agents, isSuccess }: AgentTeamsGridProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createAiTeam = useCallback(() => {
    void navigate("/create-ai-team/create");
  }, [navigate]);

  return (
    <>
      <div
        className={classNames(styles["grid-box"], styles["create-box"])}
        style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
        onClick={createAiTeam}
      >
        <AgentTeamIcon
          data-agent-teams
          className={styles["create-robot-icon"]}
        />
        <Text color="secondary" type="large">
          {t("agents.createNewAgentTeam")}
        </Text>
      </div>
      {isSuccess &&
        agents?.agentsTeams.map((_, index) => (
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
  );
}
