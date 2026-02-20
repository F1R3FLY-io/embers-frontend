import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { CurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";

import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useAgents, useDeleteAgentMutation } from "@/lib/queries";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";

import { Grid } from "../Grid";

interface AgentsTabProps {
  searchQuery: string;
  sortBy: "date" | "name";
}

export default function AgentsTab({ searchQuery, sortBy }: AgentsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const onCreate = useCallback(
    () => void navigate("/agent/create"),
    [navigate],
  );
  const onNavigate = useCallback(
    (id: string) =>
      void navigate("/agent/edit", {
        state: {
          id,
          version: "latest",
        } satisfies CurrentAgent,
      }),
    [navigate],
  );

  const deleteAgent = useMutationResultWithLoader(useDeleteAgentMutation());
  const confirm = useConfirm();
  const onDelete = (id: string, name: string) =>
    void confirm({ message: `Are you sure you want to delete ${name} agent?` })
      .then((ok) => ok && deleteAgent.mutate(id))
      .catch(() => {});

  const { data } = useAgents();

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

    return [...filtered]
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name, undefined, {
            sensitivity: "base",
          });
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .map((agent) => ({
        createdAt: agent.createdAt,
        id: agent.id,
        logo: agent.logo,
        name: agent.name,
        type:
          agent.lastDeploy === undefined
            ? ("draft" as const)
            : ("normal" as const),
      }));
  }, [data?.agents, searchQuery, sortBy]);

  return (
    <Grid
      data={filteredAgents}
      icon={AgentIcon}
      title={t("agents.createNewAgent")}
      onCreate={onCreate}
      onDelete={onDelete}
      onNavigate={onNavigate}
    />
  );
}
