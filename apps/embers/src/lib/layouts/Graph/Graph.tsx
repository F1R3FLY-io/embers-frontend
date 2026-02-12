import type React from "react";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import type { FromModel } from "@/lib/components/AgentsTeamGeneralInfoFrom";

import { AgentsTeamGeneralInfoFrom } from "@/lib/components/AgentsTeamGeneralInfoFrom";
import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/Graph";
import { Sidebar } from "@/lib/layouts/Graph/Sidebar";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useFormModal } from "@/lib/providers/modal/useFormModal";

interface GraphLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const GraphLayout: React.FC<GraphLayoutProps> = ({
  children,
  title,
}) => {
  const confirm = useConfirm();
  const navigate = useNavigate();

  const { agentsTeam, update } = useCurrentAgentsTeam();
  const formModal = useFormModal<FromModel>();

  const onBackClick = useCallback(() => {
    confirm({ message: "Do you want to leave this page?" })
      .then((ok) => ok && void navigate("/dashboard"))
      .catch(() => {});
  }, [confirm, navigate]);

  const onSettingsClick = useCallback(() => {
    formModal({
      component: (onSubmit, onCancel) => (
        <AgentsTeamGeneralInfoFrom
          initialData={{
            description: agentsTeam.description,
            execType: agentsTeam.execType!,
            flowType: agentsTeam.flowType!,
            iconUrl: agentsTeam.iconUrl,
            language: agentsTeam.language!,
            name: agentsTeam.name!,
          }}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      ),
    })
      .then(update)
      .catch(() => {});
  }, [
    agentsTeam.description,
    agentsTeam.execType,
    agentsTeam.flowType,
    agentsTeam.iconUrl,
    agentsTeam.language,
    agentsTeam.name,
    formModal,
    update,
  ]);

  return (
    <Layout
      footer={<Footer />}
      headerActions={<Header />}
      sidebar={<Sidebar />}
      title={title}
      onBackClick={onBackClick}
      onSettingsClick={onSettingsClick}
    >
      {children}
    </Layout>
  );
};
