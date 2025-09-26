import classNames from "classnames";
import { t } from "i18next";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Text } from "@/lib/components/Text";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";

import styles from "./AgentsGrid.module.scss";

export interface Agent {
  id: string;
  name: string;
  shard?: string;
  version: string;
}
interface AgentsGridProps {
  agents: Array<Agent>;
  isSuccess: boolean;
}

export function AgentsGrid({ agents, isSuccess }: AgentsGridProps) {
  const navigate = useNavigate();
  const createAiAgent = useCallback(() => {
    void navigate("/agents/create");
  }, [navigate]);

  const navigateToAgent = useCallback(
    (id: string, version: string) => {
      void navigate(`/agents/${id}/edit/${version}`);
    },
    [navigate],
  );

  return (
    <>
      <div
        className={classNames(styles["grid-box"], styles["create-box"])}
        style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
        onClick={createAiAgent}
      >
        <AgentIcon className={styles["create-robot-icon"]} />
        <Text color="secondary" type="large">
          {t("agents.createNewAgent")}
        </Text>
      </div>
      {isSuccess &&
        agents.map((agent, index) => (
          <div
            key={agent.id}
            className={classNames(styles["grid-box"])}
            style={
              {
                "--tile-delay": `${0.2 + index * 0.1}s`,
              } as React.CSSProperties
            }
            onClick={() => navigateToAgent(agent.id, agent.version)}
          >
            <Text color="secondary" type="H4">
              Agent {agent.name}
            </Text>
          </div>
        ))}
    </>
  );
}
