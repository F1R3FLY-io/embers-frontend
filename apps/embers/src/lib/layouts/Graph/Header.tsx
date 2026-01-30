import type React from "react";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/lib/components/Button";
import { PromptModal } from "@/lib/components/Modal/PromptModal";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useModal } from "@/lib/providers/modal/useModal";
import { useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";
import {
  useCreateAgentsTeamMutation,
  useRunAgentsTeamMutation,
  useSaveAgentsTeamMutation,
} from "@/lib/queries";

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { data, navigateToNextStep, updateData } = useGraphEditorStepper();
  const dock = useDock();
  const { open } = useModal();

  const id = data.id!;
  const saveMutation = useSaveAgentsTeamMutation(id);
  const createMutation = useCreateAgentsTeamMutation();
  const runAgentsTeam = useMutationResultWithLoader(useRunAgentsTeamMutation());

  const isDeployed = data.lastDeployKey || data.uri;
  const isLoading =
    createMutation.isPending ||
    saveMutation.isPending ||
    runAgentsTeam.isPending;

  const logError = useCallback(
    (err: Error) => dock.appendLog(err.message, "error"),
    [dock],
  );
  const canRun = Boolean(isDeployed && !data.hasGraphChanges);

  const saveOrCreate = useCallbackWithLoader(async () => {
    const payload = {
      description: data.description,
      edges: data.edges,
      logo: data.iconUrl,
      name: data.name,
      nodes: data.nodes,
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
  });

  const handleSave = async () => {
    if (isLoading) {
      return;
    }
    try {
      const { id, version } = await saveOrCreate();
      updateData("version", version);
      updateData("id", id);
      dock.appendLog(`Agent ${id} with ${version} has been saved!`, "info");
    } catch (e) {
      dock.appendLog(
        `Save failed: ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
      throw e;
    }
  };

  const handleDeploy = async () => {
    if (isLoading) {
      return;
    }
    try {
      const { id, version } = await saveOrCreate();
      updateData("id", id);
      updateData("version", version);
      navigateToNextStep();
    } catch (e) {
      dock.appendLog(
        `Pre-deploy save failed with error: ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
    }
  };

  const onRun = () => {
    open(
      <PromptModal
        cancelLabel={t("basic.cancel")}
        confirmLabel={t("basic.run")}
        inputLabel={t("basic.inputPrompt")}
        inputPlaceholder={t("deploy.enterInputPrompt")}
        onConfirm={(prompt) => {
          if (data.uri) {
            void runAgentsTeam
              .mutateAsync({
                prompt,
                rhoLimit: 500_000_000n,
                uri: data.uri,
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
      <Button disabled={isLoading} type="subtle" onClick={handleSave}>
        {t("deploy.saveAsDraft")}
      </Button>
      <Button
        disabled={isLoading}
        type="primary"
        onClick={async () => (canRun ? onRun() : handleDeploy())}
      >
        {canRun ? t("basic.run") : t("deploy.deploy")}
      </Button>
    </>
  );
};
