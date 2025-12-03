import type { ReactFlowJsonObject } from "@xyflow/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";
import type { GraphEditorStepperData } from "@/lib/providers/stepper/flows/GraphEditor";

import { GraphEditor } from "@/lib/components/GraphEditor";
import { PromptModal } from "@/lib/components/Modal/PromptModal";
import { Spinner } from "@/lib/components/Spinner";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useDock } from "@/lib/providers/dock/useDock";
import { useLayout } from "@/lib/providers/layout/useLayout";
import { useModal } from "@/lib/providers/modal/useModal";
import { useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";
import { useAgentsTeam, useRunAgentsTeamMutation } from "@/lib/queries";

export default function CreateAiTeamFlow() {
  const { setHeaderTitle } = useLayout();
  const { t } = useTranslation();
  const { open } = useModal();
  const { appendLog } = useDock();
  const { data, navigateToNextStep, setStep, updateData, updateMany } =
    useGraphEditorStepper();
  const location = useLocation();
  const navigate = useNavigate();
  const runAgentsTeam = useRunAgentsTeamMutation();
  const { data: agent } = useAgentsTeam(data.agentId, data.version);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const hydratedRef = useRef(false);

  const logError = useCallback(
    (err: Error) => appendLog(err.message, "error"),
    [appendLog],
  );

  const lastDeploy = data.lastDeploy;
  const agentName = agent?.name ?? data.agentName;

  useEffect(() => setHeaderTitle(agentName), [agentName, setHeaderTitle, t]);
  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    const flow = data.flow;
    const hasFlowData = Boolean(flow?.nodes.length || flow?.edges.length);
    const hasAgentData = Boolean(agent?.nodes || agent?.edges);

    if (hasFlowData) {
      hydratedRef.current = true;
      setNodes(flow!.nodes);
      setEdges(flow!.edges);
      return;
    }

    if (hasAgentData) {
      hydratedRef.current = true;
      setNodes(agent!.nodes ?? []);
      setEdges(agent!.edges ?? []);
    }
  }, [data.flow, agent, setNodes, setEdges]);


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

  useEffect(() => {
    setStep(1);
    const preload = location.state as GraphEditorStepperData;
    updateMany(preload);
    void navigate(location.pathname, { replace: true });
    // disabling because I need to run it only ONCE
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
