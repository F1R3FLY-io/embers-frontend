import type React from "react";

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { useDock } from "@/lib/providers/dock/useDock";
import { useLoader } from "@/lib/providers/loader/useLoader";
import { useStepper } from "@/lib/providers/stepper/useStepper";
import { useCreateAgentMutation, useSaveAgentMutation } from "@/lib/queries";

type HeaderProps = {
  getCode: () => string | null | undefined;
};

export const Header: React.FC<HeaderProps> = ({ getCode }) => {
  const navigate = useNavigate();
  const { data, nextStep, updateData } = useStepper();
  const dock = useDock();
  const { hideLoader, showLoader } = useLoader();

  const { agentIconUrl, agentId, agentName } = data;
  const id = useMemo(() => agentId ?? "", [agentId]);
  const createMutation = useCreateAgentMutation();
  const saveMutation = useSaveAgentMutation(id);

  const isLoading = createMutation.isPending || saveMutation.isPending;

  const saveOrCreate = async (): Promise<{
    agentId: string;
    version: string;
  }> => {
    const code = getCode()?.toString() ?? "";
    updateData("code", code);
    const payload = {
      code,
      name: agentName,
      ...(agentIconUrl ? { logo: agentIconUrl } : {}),
    };
    if (id) {
      const res = await saveMutation.mutateAsync(payload);
      return { agentId: id, version: res.version };
    }
    const res = await createMutation.mutateAsync(payload);
    return { agentId: res.id, version: res.version };
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
        `Save failed ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
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
      nextStep();
      void navigate("/create-ai-agent/deploy");
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
      <Button
        disabled={isLoading}
        type="subtle"
        onClick={() => void handleSave()}
      >
        {isLoading ? "Saving..." : id ? "Save changes" : "Save as draft"}
      </Button>

      <Button
        disabled={isLoading}
        type="primary"
        onClick={() => void handleDeploy()}
      >
        {isLoading ? "Processing..." : "Deploy"}
      </Button>
    </>
  );
};
