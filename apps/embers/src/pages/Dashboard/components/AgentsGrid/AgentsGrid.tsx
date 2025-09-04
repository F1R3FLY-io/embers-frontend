import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import classNames from "classnames";

import { Text } from "@/lib/components/Text";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";

import styles from "./AgentsGrid.module.scss";

interface AgentsGridProps {
  agents: Array<{ id: string; name: string }>;
  isSuccess: boolean;
}

export function AgentsGrid({ agents, isSuccess }: AgentsGridProps) {
  const navigate = useNavigate();
  const createAiAgent = useCallback(() => {
    void navigate("/create-ai-agent");
  }, [navigate]);

  return (
    <>
      <div
        className={classNames(styles["grid-box"], styles["create-box"])}
        style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
        onClick={createAiAgent}
      >
        <AgentIcon className={styles["create-robot-icon"]} />
        <Text color="secondary" type="large">
          Create new Agent
        </Text>
      </div>
      {isSuccess &&
        agents.map((agent, index) => (
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
  );
}
