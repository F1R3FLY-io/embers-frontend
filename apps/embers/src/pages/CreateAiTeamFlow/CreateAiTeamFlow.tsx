import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";
import type { FooterProps } from "@/lib/layouts/Graph";

import { GraphEditor } from "@/lib/components/GraphEditor";
import { Spinner } from "@/lib/components/Spinner";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useLayout } from "@/lib/providers/layout/useLayout";
import { useDeployGraphMutation, useRunDemo } from "@/lib/queries";

type Deployment = FooterProps["deployments"][number];
type Logs = FooterProps["logs"][number];

// Half-baked. Demo only
export default function CreateAiTeamFlow() {
  const { setHeaderTitle } = useLayout();
  const { t } = useTranslation();

  useEffect(() => setHeaderTitle(t("aiTeam.newAiTeam")), [setHeaderTitle, t]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [lastDeploy, setLastDeploy] = useState<string | undefined>();

  const deployGraph = useDeployGraphMutation();
  const runDemo = useRunDemo();

  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const addDeploy = useCallback(
    (deployment: Deployment) =>
      setDeployments((snapshot) => [deployment, ...snapshot]),
    [],
  );

  const [logs, setLogs] = useState<Logs[]>([]);
  const addLog = useCallback(
    (log: Logs) => setLogs((snapshot) => [log, ...snapshot]),
    [],
  );

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
    ({ name }: { name: string }) => {
      setLastDeploy(name);
      addDeploy({
        success: true,
        time: new Date(),
      });
    },
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
      footerProps={{ deployments, logs }}
      headerProps={{
        onDeploy: () =>
          void deployGraph
            .mutateAsync({ edges, nodes, rhoLimit: 1_000_000n })
            .then(() => onSuccessfulDeploy)
            .catch(onFailedDeploy),
        onRun: () =>
          lastDeploy &&
          void runDemo
            .mutateAsync({
              name: lastDeploy,
              prompt: "Describe an appearance of human-like robot",
            })
            .then((result) =>
              addLog({
                log: JSON.stringify(
                  result,
                  (_, value) => {
                    if (typeof value === "string" && value.length > 2000) {
                      return `${value.slice(0, 2000)}...`;
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
      <GraphEditor
        edges={edges}
        nodes={nodes}
        setEdges={setEdges}
        setNodes={setNodes}
      />
      <Spinner isOpen={deployGraph.isPending || runDemo.isPending} />
    </GraphLayout>
  );
}
