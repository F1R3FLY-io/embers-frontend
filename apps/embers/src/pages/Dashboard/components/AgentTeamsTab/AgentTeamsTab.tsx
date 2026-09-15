import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { CurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";

import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useAlert, useConfirm } from "@/lib/providers/modal/useConfirm";
import {
  useAgentsTeams,
  useDeleteAgentsTeamMutation,
  useTeamPublicationReader,
  useUnpublishAgentsTeamMutation,
} from "@/lib/queries";
import { needsUnpublishing, removeTeam } from "@/lib/teams/removeTeam";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";

import { Grid } from "../Grid";
import { deleteTeamMessage } from "./deleteTeamMessage";

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
  const unpublishTeam = useUnpublishAgentsTeamMutation();
  const teamPublication = useTeamPublicationReader();
  const confirm = useConfirm();
  const alert = useAlert();

  // The loader wraps only the work, never the dialogs: the spinner overlay
  // renders above every modal, so a confirm awaited under it is unreachable
  // and its promise can never settle -- the exact deadlock this structure
  // prevents. Each loader-wrapped step is refcounted, so the independently
  // wrapped delete mutation nests safely.
  const readPublication = useCallbackWithLoader(teamPublication);
  const runRemoveWithLoader = useCallbackWithLoader(
    async (
      id: string,
      publication: Awaited<ReturnType<typeof teamPublication>>,
    ) =>
      // Stop the mentions, then remove the team. Every mutation reports its own
      // failure, so this only has to halt.
      removeTeam(id, needsUnpublishing(publication), {
        deleteTeam: deleteAgentsTeam.mutateAsync,
        unpublishTeam: unpublishTeam.mutateAsync,
      }).catch(() => undefined),
  );

  const runDelete = useCallback(
    async (id: string, name: string) => {
      let publication;
      try {
        publication = await readPublication(id);
      } catch {
        // Refusing rather than guessing. Deleting a team whose publication could not
        // be read is how a handle is left answering mentions for a team that no
        // longer exists -- with the credentials needed to stop it gone with the team.
        await alert({
          message:
            "Could not determine whether this team is published, so it was not deleted. Try again once the node is responsive.",
          title: "Delete failed",
        });
        return;
      }

      if (!(await confirm({ message: deleteTeamMessage(name, publication) }))) {
        return;
      }

      await runRemoveWithLoader(id, publication);
    },
    [alert, confirm, readPublication, runRemoveWithLoader],
  );

  const onDelete = useCallback(
    (id: string, name: string) => void runDelete(id, name),
    [runDelete],
  );

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
