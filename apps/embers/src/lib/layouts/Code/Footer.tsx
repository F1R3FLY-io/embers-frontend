import type React from "react";

import classNames from "classnames";

import { Accordion } from "@/lib/components/Accordion";
import { Button } from "@/lib/components/Button";
import { Text } from "@/lib/components/Text";
import { useDock } from "@/lib/providers/dock/useDock";

import styles from "./Code.module.scss";

type LogLevel = "info" | "error";

export const Footer: React.FC = () => {
  const { clearLogs, deploys, logs, markDeploysRead, markLogsRead, unread  } = useDock();

  const levelClass = (lvl: LogLevel) =>
    classNames({
      [styles["error-log"]]: lvl === "error",
      [styles["info-log"]]: lvl === "info",
    });

  return (
    <>
      <Accordion
        actions={
          <Button
            className={styles["accordion-action"]}
            type="subtle"
            onClick={() => {}}
          >
            Test it
          </Button>
        }
        persistKey="dock.code.test"
        title="Test Agent"
      >
        <Text color="secondary">Run the test to see results here.</Text>
      </Accordion>

      <Accordion
        actions={
          <Button
            className={styles["accordion-action"]}
            type="subtle"
            onClick={clearLogs}
          >
            Clear
          </Button>
        }
        persistKey="dock.code.logs"
        title={unread.logs ? "Logs *" : "Logs"}
        onToggle={(open) => {
          if (open) {
            markLogsRead();
          }
        }}
      >
        {logs.length === 0 && <Text color="secondary">No logs yet.</Text>}
        {logs.map((l) => (
          <pre key={l.id}>
            <Text color="secondary">{new Date(l.time).toLocaleString()}</Text>{" "}
            <Text className={levelClass(l.level)}>[{l.level}]</Text>{" "}
            <Text color="primary">{l.text}</Text>
          </pre>
        ))}
      </Accordion>

      <Accordion
        persistKey="dock.code.deploy"
        title={unread.deploy ? "Deploy History *" : "Deploy History"}
        onToggle={(open) => {
          if (open) {
            markDeploysRead();
          }
        }}
      >
        {deploys.length === 0 && (
          <Text color="secondary">No deployments yet.</Text>
        )}
        {deploys.map((d) => (
          <pre key={d.id}>
            <Text color="secondary">{new Date(d.time).toLocaleString()}</Text>
            <Text color="primary">: {d.success ? "Success" : "Failure"}</Text>
          </pre>
        ))}
      </Accordion>
    </>
  );
};
