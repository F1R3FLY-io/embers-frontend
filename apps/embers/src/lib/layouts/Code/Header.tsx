import type React from "react";

import { Button } from "@/lib/components/Button";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useCodeEditorStepper } from "@/lib/providers/stepper/flows/CodeEditor";
import { useCreateAgentMutation, useSaveAgentMutation } from "@/lib/queries";

type HeaderProps = {
  getCode: () => string | null | undefined;
};

export const Header: React.FC<HeaderProps> = ({ getCode }) => {
  const { data, navigateToNextStep, updateData } = useCodeEditorStepper();
  const dock = useDock();

  const { iconUrl, id, name } = data;
  const createMutation = useCreateAgentMutation();
  const saveMutation = useSaveAgentMutation(id!);

  const isLoading = createMutation.isPending || saveMutation.isPending;

  const saveOrCreate = useCallbackWithLoader(async () => {
    const code = getCode()?.toString() ?? "";
    updateData("code", code);
    const payload = {
      code,
      name,
      ...(iconUrl ? { logo: iconUrl } : {}),
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
