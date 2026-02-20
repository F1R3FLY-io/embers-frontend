import type React from "react";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { PromptModal } from "@/lib/components/Modal/PromptModal";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useModal } from "@/lib/providers/modal/useModal";
import {
  useCreateAgentsTeamMutation,
  useRunAgentsTeamMutation,
  useSaveAgentsTeamMutation,
} from "@/lib/queries";

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { agentsTeam, update } = useCurrentAgentsTeam();
  const dock = useDock();
  const { open } = useModal();
  const navigate = useNavigate();

  const id = agentsTeam.id!;
  const saveMutation = useSaveAgentsTeamMutation(id);
  const createMutation = useCreateAgentsTeamMutation();
  const runAgentsTeam = useMutationResultWithLoader(useRunAgentsTeamMutation());

  const isDeployed = agentsTeam.lastDeployKey || agentsTeam.uri;

  const logError = useCallback(
    (err: Error) => dock.appendLog(err.message, "error"),
    [dock],
  );
  const canRun = Boolean(isDeployed && !agentsTeam.hasGraphChanges);

  const saveOrCreate = useCallback(async () => {
    const payload = {
      description: agentsTeam.description,
      edges: agentsTeam.edges!,
      logo: agentsTeam.logo,
      name: agentsTeam.name!,
      nodes: agentsTeam.nodes!,
    };
    if (id) {
      const res = await saveMutation.mutateAsync(payload);
      await res.waitForFinalization;
      return { id, version: res.prepareResponse.response.version };
    }
    const res = await createMutation.mutateAsync(payload);
    await res.waitForFinalization;
    return {
      id: res.prepareResponse.response.id,
      version: res.prepareResponse.response.version,
    };
  }, [
    agentsTeam.description,
    agentsTeam.edges,
    agentsTeam.logo,
    agentsTeam.name,
    agentsTeam.nodes,
    createMutation,
    id,
    saveMutation,
  ]);

  const handleSave = useCallbackWithLoader(async () => {
    try {
      const { id, version } = await saveOrCreate();
      update({ id, version });
      dock.appendLog(`Agent ${id} with ${version} has been saved!`, "info");
    } catch (e) {
      dock.appendLog(
        `Save failed: ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
      throw e;
    }
  });

  const handleDeploy = useCallbackWithLoader(async () => {
    try {
      const { id, version } = await saveOrCreate();
      update({ id, version });
      void navigate("/agents-team/deploy");
    } catch (e) {
      dock.appendLog(
        `Pre-deploy save failed with error: ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
    }
  });

  const onRun = () => {
    open(
      <PromptModal
        cancelLabel={t("basic.cancel")}
        confirmLabel={t("basic.run")}
        inputLabel={t("basic.inputPrompt")}
        inputPlaceholder={t("deploy.enterInputPrompt")}
        onConfirm={(prompt) => {
          if (agentsTeam.uri) {
            void runAgentsTeam
              .mutateAsync({
                prompt,
                rhoLimit: 500_000_000n,
                uri: agentsTeam.uri,
              })
              .then((result) => {
                dock.appendLog(
                  JSON.stringify(
                    result.sendResponse,
                    (_, value) =>
                      typeof value === "string" && value.length > 2000
                        ? `${value.slice(0, 2000)}...`
                        : (value as unknown),
                    4,
                  ),
                  "info",
                );
              })
              .catch(logError);
          }
        }}
      />,
      {
        ariaLabel: "Prompt modal",
        closeOnBlur: true,
        closeOnEsc: true,
        maxWidth: 550,
        showCloseButton: false,
      },
    );
  };
  return (
    <>
      <Button type="subtle" onClick={handleSave}>
        {t("deploy.saveAsDraft")}
      </Button>
      <Button
        type="primary"
        onClick={async () => (canRun ? onRun() : handleDeploy())}
      >
        {canRun ? t("basic.run") : t("deploy.deploy")}
      </Button>
    </>
  );
};
