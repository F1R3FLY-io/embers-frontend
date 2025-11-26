import type { ReactFlowJsonObject } from "@xyflow/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";
import type {GraphEditorStepperData} from "@/lib/providers/stepper/flows/GraphEditor";

import { GraphEditor } from "@/lib/components/GraphEditor";
import { PromptModal } from "@/lib/components/Modal/PromptModal";
import { Spinner } from "@/lib/components/Spinner";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useDock } from "@/lib/providers/dock/useDock";
import { useLayout } from "@/lib/providers/layout/useLayout";
import { useModal } from "@/lib/providers/modal/useModal";
import {  useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";
import { useAgentsTeam, useRunAgentsTeamMutation } from "@/lib/queries";


const testEdges = [{
  "animated": true,
  "className": "_edge_8tub8_15",
  "id": "xy-edge__a18ca89d5810f434a9a4cf5752168e318-a7829075463884b6faf90405eced3391b",
  "selected": false,
  "source": "a18ca89d5810f434a9a4cf5752168e318",
  "target": "a7829075463884b6faf90405eced3391b"
}];
const testNodes = [
  {
    "className": "_no-node-style_8tub8_19",
    "data": {
      "containerId": "default"
    },
    "id": "Ab02bd41e21194a48858c485f7ad3da46",
    "measured": {
      "height": 68,
      "width": 370
    },
    "position": {
      "x": 188.5,
      "y": 200.5227279663086
    },
    "style": {
      "height": 68.0113639831543,
      "width": 370.25
    },
    "type": "deploy-container"
  },
  {
    "className": "_no-node-style_8tub8_19",
    "data": {},
    "dragging": false,
    "extent": "parent",
    "id": "a18ca89d5810f434a9a4cf5752168e318",
    "measured": {
      "height": 58,
      "width": 150
    },
    "parentId": "Ab02bd41e21194a48858c485f7ad3da46",
    "position": {
      "x": 0,
      "y": 5.5
    },
    "selected": false,
    "type": "input"
  },
  {
    "className": "_no-node-style_8tub8_19",
    "data": {},
    "dragging": false,
    "extent": "parent",
    "id": "a7829075463884b6faf90405eced3391b",
    "measured": {
      "height": 58,
      "width": 150
    },
    "parentId": "Ab02bd41e21194a48858c485f7ad3da46",
    "position": {
      "x": 209.75,
      "y": 5.511363983154297
    },
    "selected": false,
    "type": "output"
  }
];

export default function CreateAiTeamFlow() {
  const { setHeaderTitle } = useLayout();
  const { t } = useTranslation();
  const { open } = useModal();
  const { appendLog } = useDock();
  const { data, navigateToNextStep, setStep, updateData, updateMany } =
    useGraphEditorStepper();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: agent } = useAgentsTeam(data.agentId, data.version);

  const agentName = agent?.name ?? data.agentName;
  const lastDeploy = data.lastDeploy;

  useEffect(() => setHeaderTitle(agentName), [agentName, setHeaderTitle, t]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const runAgentsTeam = useRunAgentsTeamMutation();

  const logError = useCallback(
    (err: Error) => appendLog(err.message, "error"),
    [appendLog],
  );

  useEffect(() => {
    // @ts-ignore
    setEdges(agent ? testEdges : []);
    // @ts-ignore
    setNodes(agent ? testNodes : []);
  }, [agent]);

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }
    hydratedRef.current = true;

    const flow = data.flow;

    if (flow?.nodes.length) {
      setNodes(flow.nodes);
    }
    if (flow?.edges.length) {
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
