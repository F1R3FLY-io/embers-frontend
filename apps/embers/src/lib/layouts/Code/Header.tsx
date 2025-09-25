import type React from "react";

import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { useCreateAgentMutation, useSaveAgentMutation } from "@/lib/queries";

type HeaderProps = {
  agentId: string | undefined;
  agentName: string | undefined;
  getCode: () => string | null | undefined;
};

export const Header: React.FC<HeaderProps> = ({
  agentId,
  agentName = "Agent",
  getCode,
}) => {
  const navigate = useNavigate();

  const createMutation = useCreateAgentMutation();
  const saveMutation = useSaveAgentMutation(agentId ?? "");

  const isLoading = createMutation.isPending || saveMutation.isPending;

  const saveOrCreate = async (): Promise<{
    agentId: string;
    version: string;
  }> => {
    const code = getCode()?.toString() ?? "";
    if (!code.trim()) {
      throw new Error("Empty code");
    }

    if (agentId) {
      const res = await saveMutation.mutateAsync({ code, name: agentName });
      return { agentId, version: res.version };
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
      const { agentId: id, version } = await saveOrCreate();
      void navigate(
        `/agents/${id}/deploy/${encodeURIComponent(version)}?agentName=${encodeURIComponent(agentName)}`,
        { replace: false },
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Pre-deploy save failed:", e);
    }
  };

  return (
    <>
      <Button
        disabled={isLoading}
        type="secondary"
        onClick={() => void handleSave()}
      >
        {isLoading ? "Saving..." : agentId ? "Save changes" : "Save as draft"}
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
