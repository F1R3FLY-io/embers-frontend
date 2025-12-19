import type React from "react";

import { useMemo } from "react";

import { Button } from "@/lib/components/Button";
import { useDock } from "@/lib/providers/dock/useDock";
import { useLoader } from "@/lib/providers/loader/useLoader";
import { useCodeEditorStepper } from "@/lib/providers/stepper/flows/CodeEditor";
import { useCreateAgentMutation, useSaveAgentMutation } from "@/lib/queries";

type HeaderProps = {
  getCode: () => string | null | undefined;
};

export const Header: React.FC<HeaderProps> = ({ getCode }) => {
  const { data, navigateToNextStep, updateData } = useCodeEditorStepper();
  const dock = useDock();
  const { hideLoader, showLoader } = useLoader();

  const { agentIconUrl, agentId, agentName } = data;
  const id = useMemo(() => agentId ?? "", [agentId]);
  const createMutation = useCreateAgentMutation();
  const saveMutation = useSaveAgentMutation(id);

  const isLoading = createMutation.isPending || saveMutation.isPending;

  const saveOrCreate = async () => {
    const code = getCode()?.toString() ?? "";
    updateData("code", code);
    const payload = {
      code,
      name: agentName,
      ...(agentIconUrl ? { logo: agentIconUrl } : {}),
    };
    if (id) {
      const res = await saveMutation.mutateAsync(payload);
      await res.waitForFinalization;
      return { agentId: id, version: res.prepareModel.version };
    }
    const res = await createMutation.mutateAsync(payload);
    await res.waitForFinalization;
    return { agentId: res.prepareModel.id, version: res.prepareModel.version };
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

  return (
    <>
      <Button disabled={isLoading} type="subtle" onClick={handleSave}>
        {isLoading ? "Saving..." : id ? "Save changes" : "Save as draft"}
      </Button>

      <Button disabled={isLoading} type="primary" onClick={handleDeploy}>
        {isLoading ? "Processing..." : "Deploy"}
      </Button>
    </>
  );
};
