import type React from "react";

import classNames from "classnames";

import { Accordion } from "@/lib/components/Accordion";
import { Text } from "@/lib/components/Text";
import { useDock } from "@/lib/providers/dock/useDock";

import styles from "./OSLF.module.scss";

type LogLevel = "info" | "error";

export const Footer: React.FC = () => {
  const { logs, markLogsRead, unread } = useDock();

  const logLevelClassName = (logLevel: LogLevel) =>
    classNames({
      [styles["error-log"]]: logLevel === "error",
      [styles["info-log"]]: logLevel === "info",
    });

  return (
    <Accordion
      persistKey="dock.graph.logs"
      title={unread.logs ? "Logs *" : "Logs"}
      onToggle={(open) => {
        if (open) {
          markLogsRead();
        }
      }}
    >
      {logs.map((log) => (
        <pre key={log.id}>
          <Text color="secondary">{formatTime(log.time)}</Text>
          <Text className={logLevelClassName(log.level)}>[{log.level}]</Text>
          <Text color="primary">{log.text}</Text>
        </pre>
      ))}
    </Accordion>
  );
};

function formatTime(time: Date) {
  return time.toLocaleString();
}
