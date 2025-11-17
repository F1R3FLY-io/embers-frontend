import type { ReactFlowJsonObject } from "@xyflow/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";

import { GraphEditor } from "@/lib/components/GraphEditor";
import { PromptModal } from "@/lib/components/Modal/PromptModal";
import { Spinner } from "@/lib/components/Spinner";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useDock } from "@/lib/providers/dock/useDock";
import { useLayout } from "@/lib/providers/layout/useLayout";
import { useModal } from "@/lib/providers/modal/useModal";
import { useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";
import { useRunAgentsTeamMutation } from "@/lib/queries";

export default function CreateAiTeamFlow() {
  const { setHeaderTitle } = useLayout();
  const { t } = useTranslation();
  const { open } = useModal();
  const { appendLog } = useDock();
  const { data, navigateToNextStep, updateData } = useGraphEditorStepper();

  const lastDeploy = data.lastDeploy;
  useEffect(() => setHeaderTitle(data.agentName), [data.agentName, setHeaderTitle, t]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const runAgentsTeam = useRunAgentsTeamMutation();

  const logError = useCallback(
    (err: Error) => appendLog(err.message, "error"),
    [appendLog],
  );

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }
    hydratedRef.current = true;

    const flow = data.flow as
      | {
          edges?: Edge[];
          nodes?: Node[];
          viewport?: { x: number; y: number; zoom: number };
        }
      | undefined;

    if (flow?.nodes?.length) {
      setNodes(flow.nodes);
    }
    if (flow?.edges?.length) {
      setEdges(flow.edges);
    }
  }, [data.flow]);

  const handleFlowChange = useCallback(
    (flow: ReactFlowJsonObject<Node, Edge>) => {
      updateData("flow", flow);
    },
    [updateData],
  );

  useEffect(() => {
    updateData("nodes", nodes);
  }, [nodes, updateData]);

  useEffect(() => {
    updateData("edges", edges);
  }, [edges, updateData]);

  return (
    <GraphLayout
      headerProps={{
        onDeploy: () => {
          navigateToNextStep();
        },
        onRun: () => {
          open(
            <PromptModal
              cancelLabel={t("basic.cancel")}
              confirmLabel={t("basic.run")}
              inputLabel={t("basic.inputPrompt")}
              inputPlaceholder={t("deploy.enterInputPrompt")}
              onConfirm={(prompt) => {
                if (lastDeploy) {
                  void runAgentsTeam
                    .mutateAsync({
                      prompt,
                      rhoLimit: 500_000_000n,
                      uri: lastDeploy.getPublicKey().getUri(),
                    })
                    .then((result) => {
                      appendLog(
                        JSON.stringify(
                          result.sendModel,
                          (_, value) =>
                            typeof value === "string" && value.length > 2000
                              ? `${value.slice(0, 2000)}...`
                              : (value as unknown),
                          4,
                        ),
                        "info",
                      );
                    })
                    .catch(logError);
                }
              }}
            />,
            {
              ariaLabel: "Prompt modal",
              closeOnBlur: true,
              closeOnEsc: true,
              maxWidth: 550,
              showCloseButton: false,
            },
          );
        },
      }}
    >
      <GraphEditor
        edges={edges}
        initialViewport={data.flow?.viewport}
        nodes={nodes}
        setEdges={setEdges}
        setNodes={setNodes}
        onFlowChange={handleFlowChange}
      />
      <Spinner isOpen={runAgentsTeam.isPending} />
    </GraphLayout>
  );
}
