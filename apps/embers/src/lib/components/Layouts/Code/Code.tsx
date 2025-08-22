import type React from "react";

import { Button } from "@/lib/components/Button";
import Layout from "@/lib/components/Layouts";
import CodeFooter from "@/lib/components/Layouts/Code/Footer.tsx";
import CodeHeader from "@/lib/components/Layouts/Code/Header.tsx";
import Sidebar from "@/lib/components/Sidebar";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

const CodeLayout: React.FC<DefaultLayoutProps> = ({ children }) => (
  <Layout
    footer={<CodeFooter />}
    headerActions={<CodeHeader />}
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

export default CodeLayout;
