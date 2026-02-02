import type { ReactFlowJsonObject } from "@xyflow/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";
import type { GraphEditorStepperData } from "@/lib/providers/stepper/flows/GraphEditor";

import { GraphEditor } from "@/lib/components/GraphEditor";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";
import { useAgentsTeam } from "@/lib/queries";

export default function CreateAgentsTeamFlow() {
  const { data, updateData, updateMany } = useGraphEditorStepper();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: agent } = useAgentsTeam(data.id, data.version);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const hydratedRef = useRef(false);
  const lastVersionRef = useRef(data.version);

  const agentName = agent?.name ?? data.name;

  const handleFlowChange = useCallback(
    (flow: ReactFlowJsonObject<Node, Edge>) => {
      updateData("flow", flow);
    },
    [updateData],
  );

  const handleGraphChange = useCallback(() => {
    updateData("hasGraphChanges", true);
  }, [updateData]);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    const flow = data.flow;
    const hasFlowData = Boolean(flow?.nodes.length || flow?.edges.length);
    const hasAgentData = Boolean(agent?.nodes || agent?.edges);

    if (hasAgentData) {
      hydratedRef.current = true;
      setNodes(agent!.nodes ?? []);
      setEdges(agent!.edges ?? []);
      updateData("hasGraphChanges", false);
      return;
    }

    if (hasFlowData) {
      hydratedRef.current = true;
      setNodes(flow!.nodes);
      setEdges(flow!.edges);
      updateData("hasGraphChanges", false);
    }
  }, [data.flow, agent, setNodes, setEdges, updateData]);

  useEffect(() => {
    if (lastVersionRef.current !== data.version) {
      hydratedRef.current = false;
      lastVersionRef.current = data.version;
    }
  }, [data.version]);

  useEffect(() => {
    updateData("uri", agent?.uri);
  }, [agent, updateData]);

  useEffect(() => {
    updateData("nodes", nodes);
  }, [nodes, updateData]);

  useEffect(() => {
    updateData("edges", edges);
  }, [edges, updateData]);

  useEffect(() => {
    const preload = location.state as GraphEditorStepperData;
    updateMany(preload);
    void navigate(location.pathname, { replace: true });
    // disabling because I need to run it only ONCE
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GraphLayout title={agentName}>
      <GraphEditor
        edges={edges}
        initialViewport={data.flow?.viewport}
        nodes={nodes}
        setEdges={setEdges}
        setNodes={setNodes}
        onFlowChange={handleFlowChange}
        onGraphChange={handleGraphChange}
      />
    </GraphLayout>
  );
}
