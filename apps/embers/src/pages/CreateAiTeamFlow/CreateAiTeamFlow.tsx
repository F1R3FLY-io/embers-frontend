import { PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";

import { GraphEditor } from "@/lib/components/GraphEditor";
import { Spinner } from "@/lib/components/Spinner";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useDock } from "@/lib/providers/dock/useDock";
import { useLayout } from "@/lib/providers/layout/useLayout";
import {
  useDeployGraphMutation,
  useRunAgentsTeamMutation,
} from "@/lib/queries";

export default function CreateAiTeamFlow() {
  const { setHeaderTitle } = useLayout();
  const { t } = useTranslation();
  const { appendDeploy, appendLog } = useDock();

  useEffect(() => setHeaderTitle(t("aiTeam.newAiTeam")), [setHeaderTitle, t]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [lastDeploy, setLastDeploy] = useState<PrivateKey | undefined>();

  const deployGraph = useDeployGraphMutation();
  const runAgentsTeam = useRunAgentsTeamMutation();

  const logError = useCallback(
    (err: Error) => appendLog(err.message, "error"),
    [appendLog],
  );

  const onSuccessfulDeploy = useCallback(
    (key: PrivateKey) => {
      setLastDeploy(key);
      appendDeploy(true);
    },
    [appendDeploy],
  );

  const onFailedDeploy = useCallback(
    (err: Error) => {
      appendDeploy(false);
      logError(err);
    },
    [appendDeploy, logError],
  );

  return (
    <GraphLayout
      headerProps={{
        onDeploy: () => {
          const registryKey = PrivateKey.new();
          appendLog("Starting deploy…");
          void deployGraph
            .mutateAsync({
              edges,
              nodes,
              registryKey,
              registryVersion: 1n,
              rhoLimit: 1_000_000n,
            })
            .then(() => {
              appendLog("Deploy finished");
              onSuccessfulDeploy(registryKey);
            })
            .catch(onFailedDeploy);
        },
        onRun: () =>
          lastDeploy &&
          void runAgentsTeam
            .mutateAsync({
              prompt: "Describe an appearance of human-like robot",
              rhoLimit: 500_000_000n,
              uri: lastDeploy.getPublicKey().getUri(),
            })
            .then((result) => {
              appendLog(
                JSON.stringify(
                  result,
                  (_, value) =>
                    typeof value === "string" && value.length > 2000
                      ? `${value.slice(0, 2000)}...`
                      : (value as unknown),
                  4,
                ),
                "info",
              );
            })
            .catch(logError),
      }}
    >
      <GraphEditor
        edges={edges}
        nodes={nodes}
        setEdges={setEdges}
        setNodes={setNodes}
      />
      <Spinner isOpen={deployGraph.isPending || runAgentsTeam.isPending} />
    </GraphLayout>
  );
}
