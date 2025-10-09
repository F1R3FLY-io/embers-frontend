import type React from "react";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { Sidebar } from "@/lib/components/Sidebar";
import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/Code";
import { useConfirm } from "@/lib/providers/modal/useConfirm";

interface CodeLayoutProps {
  children: React.ReactNode;
  getCode: () => string | undefined | null;
}

export const CodeLayout: React.FC<CodeLayoutProps> = ({
  children,
  getCode,
}) => {
  const confirm = useConfirm();
  const navigate = useNavigate();

  const headerClick = useCallback(() => {
    confirm({
      message: "Do you want to leave this page?",
    })
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
          actions={
            <Button type="subtle" onClick={() => {}}>
              New
            </Button>
          }
          title="Explorer"
        >
          {null}
        </Sidebar>
      }
      sidebarWidth={320}
    >
      {children}
    </Layout>
  );
};
