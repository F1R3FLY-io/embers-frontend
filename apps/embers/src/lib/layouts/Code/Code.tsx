import type React from "react";

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "@/lib/layouts";
import { Footer, Header, Sidebar } from "@/lib/layouts/Code";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useCodeEditorStepper } from "@/lib/providers/stepper/flows/CodeEditor";

interface CodeLayoutProps {
  children: React.ReactNode;
  currentVersion: string | undefined;
  getCode: () => string | undefined | null;
  versions: string[] | undefined;
}

export const CodeLayout: React.FC<CodeLayoutProps> = ({
  children,
  currentVersion,
  getCode,
  versions,
}) => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { updateData } = useCodeEditorStepper();

  const [selectedId, setSelectedId] = useState<string | undefined>(
    currentVersion,
  );

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
          selectedId={selectedId}
          versions={versions ?? []}
          onSelect={(id) => {
            setSelectedId(id);
            updateData("version", id);
          }}
        />
      }
      sidebarWidth={320}
    >
      {children}
    </Layout>
  );
};
