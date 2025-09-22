import type React from "react";

import { useId , useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { useCreateAgentMutation } from "@/lib/queries";

type HeaderProps = {
  getCode: () => string | null | undefined;
};

export const Header: React.FC<HeaderProps> = ({ getCode }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const agentName = `test-${useId()}`;

  const createAgentMutation = useCreateAgentMutation();

  const handleDraft = () => {
    const code = getCode();

    if(code) {
      if (isSaving) {
        return;
      }
      setIsSaving(true);
      createAgentMutation.mutate(
        { code, name: agentName },
        {
          onError: (error) => {
            // eslint-disable-next-line no-console
            console.error("Error creating agent draft:", error);
            setIsSaving(false);
          },
          onSuccess: (result) => {
            // eslint-disable-next-line no-console
            console.log(`Agent draft created with ID: ${result.id}`);
            setIsSaving(false);
          },
        },
      );
    }
  };

  const handleDeploy = () => {
    const code = getCode();
    if(code) {
      if (isRedirecting) {
        return;
      }
      setIsRedirecting(true);
      createAgentMutation.mutate(
        { code, name: agentName },
        {
          onError: (error) => {
            // eslint-disable-next-line no-console
            console.error("Error creating agent:", error);
            setIsRedirecting(false);
          },
          onSuccess: (result) => {
            const { id: agentId, version } = result;

            void navigate(`/agents/${agentId}/deploy?version=${encodeURIComponent(version)}`, {
              replace: false,
            });

            setIsRedirecting(false);
          },
        },
      );
    }

  };

  return (
    <>
      <Button disabled={isSaving} type="secondary" onClick={handleDraft}>
        {isSaving ? "Saving..." : "Save as draft"}
      </Button>
      <Button disabled={isRedirecting} type="primary" onClick={handleDeploy}>
        {isRedirecting ? "Processing..." : "Deploy"}
      </Button>
    </>
  );
};
