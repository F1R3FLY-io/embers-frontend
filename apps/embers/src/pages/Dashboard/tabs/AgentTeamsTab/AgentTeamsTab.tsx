import { useAgentsTeams } from "@/lib/queries";
import { AgentTeamsGrid } from "@/pages/Dashboard/components/AgentTeamsGrid";

export default function AgentTeamsTab() {
  const { data, isSuccess } = useAgentsTeams();
  return <AgentTeamsGrid agents={data} isSuccess={isSuccess} />;
}
