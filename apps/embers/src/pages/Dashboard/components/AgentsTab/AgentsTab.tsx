import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { CurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";

import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useAlert, useConfirm } from "@/lib/providers/modal/useConfirm";
import {
  useAgents,
  useDeleteAgentMutation,
  useDeleteAgentsTeamMutation,
  useReferencingTeamsReader,
  useUnpublishAgentsTeamMutation,
} from "@/lib/queries";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";

import { Grid } from "../Grid";
import { cascadeMessage, runCascade } from "./deleteAgentCascade";

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
  const deleteAgent = useMutationResultWithLoader(useDeleteAgentMutation());
  const deleteTeam = useDeleteAgentsTeamMutation();
  const unpublishTeam = useUnpublishAgentsTeamMutation();
  const confirm = useConfirm();
  const alert = useAlert();

  // Read only when a deletion is actually being considered: it costs a team-list
  // read plus a parse per team, which nobody should pay for merely opening the page.
  const referencingTeams = useReferencingTeamsReader();

  const runDelete = useCallbackWithLoader(async (id: string, name: string) => {
    let teams;
    try {
      teams = await referencingTeams(id);
    } catch {
      // Refusing rather than guessing. Deleting without knowing which teams use
      // the agent is how a team ends up silently unrepairable, which is the whole
      // reason this check exists.
      await alert({
        message:
          "Could not determine which teams use this agent, so it was not deleted. Try again once the node is responsive.",
        title: "Delete failed",
      });
      return;
    }

    if (!(await confirm({ message: cascadeMessage(name, teams) }))) {
      return;
    }

    // Each team stopped and removed, then the agent, halting at the first failure:
    // an interrupted cascade must never leave a team pointing at an agent that no
    // longer exists. Every mutation here reports its own failure, so this only has
    // to stop the cascade rather than re-announce it -- a second dialog for one
    // failure reads as a second failure.
    await runCascade(id, teams, {
      deleteAgent: deleteAgent.mutateAsync,
      deleteTeam: deleteTeam.mutateAsync,
      unpublishTeam: unpublishTeam.mutateAsync,
    }).catch(() => undefined);
  });

  const onDelete = useCallback(
    (id: string, name: string) => void runDelete(id, name),
    [runDelete],
  );

  const { data } = useAgents();

  // Carry the name across so the editor can title its document immediately;
  // otherwise it opens unnamed and renames once the agent finishes loading.
  const onNavigate = useCallback(
    (id: string) =>
      void navigate("/agent/edit", {
        state: {
          id,
          name: data?.agents.find((agent) => agent.id === id)?.name,
          version: "latest",
        } satisfies CurrentAgent,
      }),
    [data?.agents, navigate],
  );

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
