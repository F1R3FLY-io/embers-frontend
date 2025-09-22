import type React from "react";

import { Button } from "@/lib/components/Button";
import { Sidebar } from "@/lib/components/Sidebar";
import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/Code";

interface CodeLayoutProps {
  agentId?: string | undefined;
  agentName?: string | undefined;
  children: React.ReactNode;
  getCode: () => string | undefined | null;
}

export const CodeLayout: React.FC<CodeLayoutProps> = ({ agentId, agentName, children, getCode }) => (
  <Layout
    footer={<Footer />}
    headerActions={<Header agentId={agentId} agentName={agentName} getCode={getCode} />}
    sidebar={
      <Sidebar
        actions={
          <Button type="secondary" onClick={() => {}}>
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
