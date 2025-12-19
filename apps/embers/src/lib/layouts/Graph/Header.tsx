import type React from "react";

import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/lib/components/Button";
import { PromptModal } from "@/lib/components/Modal/PromptModal";
import { useDock } from "@/lib/providers/dock/useDock";
import { useLoader } from "@/lib/providers/loader/useLoader";
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
  const { hideLoader, showLoader } = useLoader();
  const { open } = useModal();

  const id = useMemo(() => data.agentId ?? "", [data.agentId]);
  const saveMutation = useSaveAgentsTeamMutation(id);
  const createMutation = useCreateAgentsTeamMutation();
  const runAgentsTeam = useRunAgentsTeamMutation();

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

  const saveOrCreate = async () => {
    const payload = {
      description: data.description ?? "",
      edges: data.edges,
      name: data.agentName,
      nodes: data.nodes,
      ...(data.iconUrl ? { logo: data.iconUrl } : {}),
    };
    if (id) {
      const res = await saveMutation.mutateAsync(payload);
      await res.waitForFinalization;
      return { agentId: id, version: res.prepareResponse.response.version };
    }
    const res = await createMutation.mutateAsync(payload);
    await res.waitForFinalization;
    return {
      agentId: res.prepareResponse.response.id,
      version: res.prepareResponse.response.version,
    };
  };

  const handleSave = async () => {
    if (isLoading) {
      return;
    }
    try {
      showLoader();
      const { agentId, version } = await saveOrCreate();
      updateData("version", version);
      updateData("agentId", agentId);
      dock.appendLog(
        `Agent ${agentId} with ${version} has been saved!`,
        "info",
      );
      return { agentId, version };
    } catch (e) {
      dock.appendLog(
        `Save failed: ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
      throw e;
    } finally {
      hideLoader();
    }
  };

  const handleDeploy = async () => {
    if (isLoading) {
      return;
    }
    try {
      showLoader();
      const { agentId, version } = await saveOrCreate();
      updateData("agentId", agentId);
      updateData("version", version);
      navigateToNextStep();
    } catch (e) {
      dock.appendLog(
        `Pre-deploy save failed with error: ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
    } finally {
      hideLoader();
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
            showLoader();
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
              .catch(logError)
              .finally(hideLoader);
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
      <Button
        disabled={isLoading}
        type="subtle"
        onClick={() => void handleSave()}
      >
        {t("deploy.saveAsDraft")}
      </Button>
      <Button
        disabled={isLoading}
        type="primary"
        onClick={() => (canRun ? onRun() : void handleDeploy())}
      >
        {canRun ? t("basic.run") : t("deploy.deploy")}
      </Button>
    </>
  );
};
