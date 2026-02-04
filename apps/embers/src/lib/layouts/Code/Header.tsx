import type React from "react";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { useCurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useCreateAgentMutation, useSaveAgentMutation } from "@/lib/queries";

type HeaderProps = {
  getCode: () => string | null | undefined;
};

export const Header: React.FC<HeaderProps> = ({ getCode }) => {
  const navigate = useNavigate();
  const dock = useDock();

  const { agent, update } = useCurrentAgent();

  const createMutation = useCreateAgentMutation();
  const saveMutation = useSaveAgentMutation(agent.id!);

  const isLoading = createMutation.isPending || saveMutation.isPending;

  const saveOrCreate = useCallback(async () => {
    const code = getCode() ?? "";
    update({ code });
    const payload = {
      code,
      logo: agent.iconUrl,
      name: agent.name!,
    };
    if (agent.id) {
      const res = await saveMutation.mutateAsync(payload);
      await res.waitForFinalization;
      return { id: agent.id, version: res.prepareResponse.response.version };
    }
    const res = await createMutation.mutateAsync(payload);
    await res.waitForFinalization;
    return {
      id: res.prepareResponse.response.id,
      version: res.prepareResponse.response.version,
    };
  }, [
    agent.iconUrl,
    agent.id,
    agent.name,
    createMutation,
    getCode,
    saveMutation,
    update,
  ]);

  const handleSave = useCallbackWithLoader(
    useCallback(async () => {
      try {
        const idVersion = await saveOrCreate();
        update(idVersion);
        dock.appendLog(
          `Agent ${idVersion.id} with ${idVersion.version} has been saved!`,
          "info",
        );
      } catch (e) {
        dock.appendLog(
          `Save failed: ${e instanceof Error ? e.message : String(e)}`,
          "error",
        );
        throw e;
      }
    }, [dock, saveOrCreate, update]),
  );

  const handleDeploy = useCallbackWithLoader(
    useCallback(async () => {
      try {
        const idVersion = await saveOrCreate();
        update(idVersion);
        await navigate("/agent/deploy");
      } catch (e) {
        dock.appendLog(
          `Pre-deploy save failed with error: ${e instanceof Error ? e.message : String(e)}`,
          "error",
        );
      }
    }, [dock, navigate, saveOrCreate, update]),
  );

  return (
    <>
      <Button disabled={isLoading} type="subtle" onClick={handleSave}>
        {isLoading ? "Saving..." : "Save changes"}
      </Button>

      <Button disabled={isLoading} type="primary" onClick={handleDeploy}>
        {isLoading ? "Processing..." : "Deploy"}
      </Button>
    </>
  );
};
