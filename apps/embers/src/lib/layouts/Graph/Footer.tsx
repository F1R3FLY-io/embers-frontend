import type React from "react";

import classNames from "classnames";

import { Accordion } from "@/lib/components/Accordion";
import { Text } from "@/lib/components/Text";
import { useDock } from "@/lib/providers/dock/useDock";

import styles from "./Graph.module.scss";

type LogLevel = "info" | "error";

export const Footer: React.FC = () => {
  const { deploys, logs } = useDock();

  const logLevelClassName = (logLevel: LogLevel) =>
    classNames({
      [styles["error-log"]]: logLevel === "error",
      [styles["info-log"]]: logLevel === "info",
    });

  return (
    <>
      <Accordion title="Logs">
        {logs.map((log) => (
          <pre key={log.id}>
            <Text color="secondary">{formatTime(log.time)}</Text>
            <Text className={logLevelClassName(log.level)}>[{log.level}]</Text>
            <Text color="primary">{log.text}</Text>
          </pre>
        ))}
      </Accordion>

      <Accordion title="Deploy History">
        {deploys.map((deploy) => (
          <pre key={deploy.id}>
            <Text color="secondary">{formatTime(deploy.time)}</Text>
            <Text color="primary">
              : {deploy.success ? "Success" : "Failure"}
            </Text>
          </pre>
        ))}
      </Accordion>
    </>
  );
};

function formatTime(time: Date) {
  return time.toLocaleString();
}
