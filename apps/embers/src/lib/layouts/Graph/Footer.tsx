import type React from "react";

import classNames from "classnames";

import { Accordion } from "@/lib/components/Accordion";
import { Text } from "@/lib/components/Text";

import styles from "./Graph.module.scss";

type LogLevel = "info" | "error";

export type FooterProps = {
  deployments: {
    success: boolean;
    time: Date;
  }[];
  logs: {
    log: string;
    logLevel: LogLevel;
    time: Date;
  }[];
};

export const Footer: React.FC<FooterProps> = ({ deployments, logs }) => {
  const logLevelClassName = (logLevel: LogLevel) =>
    classNames({
      [styles["error-log"]]: logLevel === "error",
      [styles["info-log"]]: logLevel === "info",
    });

  return (
    <>
      <Accordion title="Logs">
        {logs.map((log) => (
          <pre key={log.time.toISOString()} style={{ wordBreak: "break-word" }}>
            <Text color="secondary">{formatTime(log.time)}</Text>
            <Text className={logLevelClassName(log.logLevel)}>
              [{log.logLevel}]
            </Text>
            <Text color="primary">{log.log}</Text>
          </pre>
        ))}
      </Accordion>
      <Accordion title="Deploy History">
        {deployments.map((deploy) => (
          <pre key={deploy.time.toISOString()}>
            <Text color="secondary">{formatTime(deploy.time)}</Text>
            <Text color="primary">: </Text>
            {deploy.success ? (
              <Text color="primary">Success</Text>
            ) : (
              <Text color="primary">Failure</Text>
            )}
          </pre>
        ))}
      </Accordion>
    </>
  );
};

function formatTime(time: Date) {
  return time.toISOString().replace("T", " ").substring(0, 19);
}
