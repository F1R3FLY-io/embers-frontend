import type React from "react";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/lib/components/Button";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useOSLFEditorStepper } from "@/lib/providers/stepper/flows/OSLFEditor";
import { useCreateOslfMutation, useSaveOslfMutation } from "@/lib/queries";

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { data, navigateToNextStep, updateData } = useOSLFEditorStepper();
  const dock = useDock();

  const id = useMemo(() => data.id ?? "", [data.id]);
  const saveMutation = useSaveOslfMutation(id);
  const createMutation = useCreateOslfMutation();

  const isLoading = createMutation.isPending || saveMutation.isPending;

  const canRun = !data.hasChanges;

  const saveOrCreate = useCallbackWithLoader(async () => {
    const payload = {
      description: data.description ?? "",
      name: data.name,
      query: data.query,
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
      dock.appendLog(`${id} with ${version} has been saved!`, "info");
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
    //not implemented
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
        {canRun ? t("oslf.validate") : t("deploy.deploy")}
      </Button>
    </>
  );
};
