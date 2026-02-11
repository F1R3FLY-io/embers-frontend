import type React from "react";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import type { FromModel } from "@/lib/components/AgentGeneralInfoFrom";

import { AgentGeneralInfoFrom } from "@/lib/components/AgentGeneralInfoFrom";
import { Layout } from "@/lib/layouts";
import { Footer, Header, Sidebar } from "@/lib/layouts/Code";
import { useCurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useFormModal } from "@/lib/providers/modal/useFormModal";

interface CodeLayoutProps {
  children: React.ReactNode;
  currentVersion?: string;
  getCode: () => string | undefined | null;
  title: string;
  versions: string[];
}

export const CodeLayout: React.FC<CodeLayoutProps> = ({
  children,
  currentVersion,
  getCode,
  title,
  versions,
}) => {
  const confirm = useConfirm();
  const formModal = useFormModal<FromModel>();
  const navigate = useNavigate();
  const { agent, update } = useCurrentAgent();

  const onBackClick = useCallback(() => {
    confirm({ message: "Do you want to leave this page?" })
      .then((ok) => ok && void navigate("/dashboard"))
      .catch(() => {});
  }, [confirm, navigate]);

  const onSettingsClick = useCallback(() => {
    formModal({
      component: (onSubmit, onCancel) => (
        <AgentGeneralInfoFrom
          initialData={{
            description: agent.description,
            iconUrl: agent.iconUrl,
            name: agent.name!,
          }}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      ),
    })
      .then(update)
      .catch(() => {});
  }, [agent, formModal, update]);

  return (
    <Layout
      footer={<Footer />}
      headerActions={<Header getCode={getCode} />}
      sidebar={
        <Sidebar
          selectedId={currentVersion}
          versions={versions}
          onSelect={(version) => update({ version })}
        />
      }
      sidebarWidth={320}
      title={title}
      onBackClick={onBackClick}
      onSettingsClick={onSettingsClick}
    >
      {children}
    </Layout>
  );
};
