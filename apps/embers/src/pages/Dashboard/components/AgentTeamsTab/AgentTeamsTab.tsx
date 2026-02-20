import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { CurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";

import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useAgentsTeams, useDeleteAgentsTeamMutation } from "@/lib/queries";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";

import { Grid } from "../Grid";

interface AgentTeamsTabProps {
  searchQuery: string;
  sortBy: "date" | "name";
}

export default function AgentTeamsTab({
  searchQuery,
  sortBy,
}: AgentTeamsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const onCreate = useCallback(
    () => void navigate("/agents-team/create"),
    [navigate],
  );
  const onNavigate = useCallback(
    (id: string) =>
      void navigate("/agents-team/edit", {
        state: {
          id,
          version: "latest",
        } satisfies CurrentAgentsTeam,
      }),
    [navigate],
  );

  const deleteAgentsTeam = useMutationResultWithLoader(
    useDeleteAgentsTeamMutation(),
  );
  const confirm = useConfirm();
  const onDelete = (id: string, name: string) =>
    void confirm({
      message: `Are you sure you want to delete ${name} agents team?`,
    })
      .then((ok) => ok && deleteAgentsTeam.mutate(id))
      .catch(() => {});

  const onPublish = useCallback(
    (id: string) =>
      void navigate("/agents-team/publish", {
        state: {
          id,
          version: "latest",
        } satisfies CurrentAgentsTeam,
      }),
    [navigate],
  );

  const { data } = useAgentsTeams();

  const filteredAgents = useMemo(() => {
    const agents = data?.agentsTeams ?? [];
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
  }, [data?.agentsTeams, searchQuery, sortBy]);

  return (
    <Grid
      data={filteredAgents}
      icon={AgentIcon}
      title={t("agents.createNewAgentTeam")}
      onCreate={onCreate}
      onDelete={onDelete}
      onNavigate={onNavigate}
      onPublish={onPublish}
    />
  );
}
