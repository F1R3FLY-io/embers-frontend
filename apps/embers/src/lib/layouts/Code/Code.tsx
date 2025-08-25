import type React from "react";

import { Button } from "@/lib/components/Button";
import { Sidebar } from "@/lib/components/Sidebar";
import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/Code";

interface CodeLayoutProps {
  children: React.ReactNode;
}

export const CodeLayout: React.FC<CodeLayoutProps> = ({ children }) => (
  <Layout
    footer={<Footer />}
    headerActions={<Header />}
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
