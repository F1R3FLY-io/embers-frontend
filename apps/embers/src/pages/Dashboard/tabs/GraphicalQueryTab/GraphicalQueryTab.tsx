import { useMemo } from "react";

import { useOslfs } from "@/lib/queries";
import { GraphicalQueryGrid } from "@/pages/Dashboard/components/GraphicalQueryGrid";

interface AgentTeamsTabProps {
  searchQuery: string;
  sortBy: "date" | "name";
}

export default function GraphicalQueryTab({
  searchQuery,
  sortBy,
}: AgentTeamsTabProps) {
  const { data, isSuccess } = useOslfs();

  const filteredOSLF = useMemo(() => {
    const agents = data?.oslfs ?? [];
    const q = searchQuery.trim().toLowerCase();

    const filtered = q
      ? agents.filter((a) => {
          const fields = [a.name, a.id, a.version]
            .filter(Boolean)
            .map((v) => v.toLowerCase());
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
  }, [data?.oslfs, searchQuery, sortBy]);
  return <GraphicalQueryGrid isSuccess={isSuccess} queries={filteredOSLF} />;
}
