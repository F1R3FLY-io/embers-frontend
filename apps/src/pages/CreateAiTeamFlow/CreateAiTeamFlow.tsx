import { useCallback, useEffect, useState } from "react";
import { GraphEditor } from "@/lib/components/GraphEditor";
import { Spinner } from "@/lib/components/Spinner";
import type { FooterProps } from "@/lib/layouts/Graph";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useLayout } from "@/lib/providers/layout/useLayout";
import { useDeployDemo, useRunDemo } from "@/lib/queries";

type Deployment = FooterProps["deployments"][number];
type Logs = FooterProps["logs"][number];

// Half-baked. Demo only
export default function CreateAiTeamFlow() {
  const { setHeaderTitle } = useLayout();
  useEffect(() => setHeaderTitle("New AI team"), [setHeaderTitle]);

  const deployDemo = useDeployDemo();
  const runDemo = useRunDemo();

  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const addDeploy = useCallback(
    (deployment: Deployment) => setDeployments((snapshot) => [...snapshot, deployment]),
    [],
  );

  const [logs, setLogs] = useState<Logs[]>([]);
  const addLog = useCallback((log: Logs) => setLogs((snapshot) => [...snapshot, log]), []);

  const logError = useCallback(
    (err: Error) =>
      addLog({
        log: err.message,
        logLevel: "error",
        time: new Date(),
      }),
    [addLog],
  );

  const onSuccessfulDeploy = useCallback(
    () =>
      addDeploy({
        success: true,
        time: new Date(),
      }),
    [addDeploy],
  );

  const onFailedDeploy = useCallback(
    (err: Error) => {
      addDeploy({
        success: false,
        time: new Date(),
      });
      logError(err);
    },
    [addDeploy, logError],
  );

  return (
    <GraphLayout
      footerProps={{
        deployments,
        logs,
      }}
      headerProps={{
        onDeploy: () =>
          void deployDemo.mutateAsync("demoName").then(onSuccessfulDeploy).catch(onFailedDeploy),
        onRun: () =>
          void runDemo
            .mutateAsync({
              name: "demoName",
              prompt: "Describe an appearance of human-like robot",
            })
            .then((result) =>
              addLog({
                log: JSON.stringify(
                  result,
                  (key, value) => {
                    if (typeof value === "string" && key === "textToAudioAnswer") {
                      return `${value.slice(0, 120)}...`;
                    }
                    return value as unknown;
                  },
                  4,
                ),
                logLevel: "info",
                time: new Date(),
              }),
            )
            .catch(logError),
      }}
    >
      <GraphEditor />
      <Spinner isOpen={deployDemo.isPending || runDemo.isPending} />
    </GraphLayout>
  );
}
