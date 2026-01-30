import type React from "react";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "@/lib/layouts";
import { Footer, Header, Sidebar } from "@/lib/layouts/Code";
import { useCurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";
import { useConfirm } from "@/lib/providers/modal/useConfirm";

interface CodeLayoutProps {
  children: React.ReactNode;
  currentVersion?: string;
  getCode: () => string | undefined | null;
  title?: string;
  versions?: string[];
}

export const CodeLayout: React.FC<CodeLayoutProps> = ({
  children,
  currentVersion,
  getCode,
  title,
  versions,
}) => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { update } = useCurrentAgent();

  const headerClick = useCallback(() => {
    confirm({ message: "Do you want to leave this page?" })
      .then((ok) => ok && void navigate("/dashboard"))
      .catch(() => {});
  }, [confirm, navigate]);

  return (
    <Layout
      footer={<Footer />}
      headerActions={<Header getCode={getCode} />}
      headerClickAction={headerClick}
      sidebar={
        <Sidebar
          selectedId={currentVersion}
          versions={versions ?? []}
          onSelect={(version) => update({ version })}
        />
      }
      sidebarWidth={320}
      title={title}
    >
      {children}
    </Layout>
  );
};
