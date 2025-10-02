import type React from "react";

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { useStepper } from "@/lib/providers/stepper/useStepper";
import { useCreateAgentMutation, useSaveAgentMutation } from "@/lib/queries";

type HeaderProps = {
  getCode: () => string | null | undefined;
};

export const Header: React.FC<HeaderProps> = ({
  getCode,
}) => {
  const navigate = useNavigate();

  const { data, nextStep, updateData } = useStepper();

  const { agentId, agentName } = data;
  const id = useMemo(() => agentId ?? "", [agentId]);
  const createMutation = useCreateAgentMutation();
  const saveMutation = useSaveAgentMutation(id);

  const isLoading = createMutation.isPending || saveMutation.isPending;

  const saveOrCreate = async (): Promise<{
    agentId: string;
    version: string;
  }> => {
    const code = getCode()?.toString() ?? "";
    updateData('code', code);

    if (id) {
      const res = await saveMutation.mutateAsync({ code, name: agentName });
      return { agentId: id, version: res.version };
    }

    const res = await createMutation.mutateAsync({ code, name: agentName });
    return { agentId: res.id, version: res.version };
  };

  const handleSave = async () => {
    if (isLoading) {
      return;
    }
    try {
      await saveOrCreate();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Save failed:", e);
    }
  };

  const handleDeploy = async () => {
    if (isLoading) {
      return;
    }
    try {
      const { agentId, version } = await saveOrCreate();
      updateData('agentId', agentId);
      updateData('version', version);
      nextStep();
      void navigate('/create-ai-agent/deploy');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Pre-deploy save failed:", e);
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
