import { useMemo } from "react";

import { useAgents } from "@/lib/queries";
import { AgentsGrid } from "@/pages/Dashboard/components/AgentsGrid";

type SortBy = "date" | "name";

interface AgentsTabProps {
  searchQuery: string;
  sortBy: SortBy;
}

export default function AgentsTab({ searchQuery, sortBy }: AgentsTabProps) {
  const { data, isSuccess } = useAgents();

  const filteredAgents = useMemo(() => {
    const agents = data?.agents ?? [];
    const q = searchQuery.trim().toLowerCase();

    const filtered = q
      ? agents.filter((a) => {
        const fields = [a.name, a.id, a.shard, a.version]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        return fields.some((f) => f.includes(q));
      })
      : agents;

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [data?.agents, searchQuery, sortBy]);

  return <AgentsGrid agents={filteredAgents} isSuccess={isSuccess} />;
}
