import classNames from "classnames";

import { Text } from "@/lib/components/Text";
import AgentTeamIcon from "@/public/icons/agentsteam-icon.svg?react";

import styles from "./AgentTeamsGrid.module.scss";

export function AgentTeamsGrid() {
  return (
    <>
      <div
        className={classNames(styles["grid-box"], styles["create-box"])}
        style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
      >
        <AgentTeamIcon
          data-agent-teams
          className={styles["create-robot-icon"]}
        />
        <Text color="secondary" type="large">
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
  );
}
