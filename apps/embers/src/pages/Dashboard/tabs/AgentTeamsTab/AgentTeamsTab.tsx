import { useMemo } from "react";

import { useAgentsTeams } from "@/lib/queries";
import { AgentTeamsGrid } from "@/pages/Dashboard/components/AgentTeamsGrid";

interface AgentTeamsTabProps {
  searchQuery: string;
  sortBy: "date" | "name";
}

export default function AgentTeamsTab({ searchQuery, sortBy }: AgentTeamsTabProps) {
  const { data, isSuccess } = useAgentsTeams();

  // const filteredAgents = useMemo(() => {
  //   const agents = data?.agents ?? [];
  //   const q = searchQuery.trim().toLowerCase();
  //
  //   const filtered = q
  //     ? agents.filter((a) => {
  //       const fields = [a.name, a.id, a.shard, a.version]
  //         .filter(Boolean)
  //         .map((v) => String(v).toLowerCase());
  //       return fields.some((f) => f.includes(q));
  //     })
  //     : agents;
  //
  //   return [...filtered].sort((a, b) => {
  //     if (sortBy === "name") {
  //       return a.name.localeCompare(b.name, undefined, {
  //         sensitivity: "base",
  //       });
  //     }
  //     return b.createdAt.getTime() - a.createdAt.getTime();
  //   });
  // }, [data?.agents, searchQuery, sortProjectsByAffinity]);
  return <AgentTeamsGrid agents={data} isSuccess={isSuccess}  />;
}
