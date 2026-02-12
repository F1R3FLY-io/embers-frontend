import { useCallback } from "react";

import { GraphEditor } from "@/lib/components/GraphEditor";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";

export default function EditAgentsTeam() {
  const { agentsTeam, update } = useCurrentAgentsTeam();

  const handleGraphChange = useCallback(
    () => update({ hasGraphChanges: true }),
    [update],
  );

  return (
    <GraphLayout title={agentsTeam.name!}>
      <GraphEditor
        edges={agentsTeam.edges ?? []}
        nodes={agentsTeam.nodes ?? []}
        setEdges={(change) => update({ edges: change(agentsTeam.edges ?? []) })}
        setNodes={(change) => update({ nodes: change(agentsTeam.nodes ?? []) })}
        onGraphChange={handleGraphChange}
      />
    </GraphLayout>
  );
}
