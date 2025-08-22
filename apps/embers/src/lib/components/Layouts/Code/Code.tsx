import type React from "react";

import Layout from "@/lib/components/Layouts";
import CodeFooter from "@/lib/components/Layouts/Code/Footer.tsx";
import CodeHeader from "@/lib/components/Layouts/Code/Header.tsx";
import Sidebar from "@/lib/components/Sidebar";
import { Button } from "@/lib/components/Button";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

function FileExplorer() {
  return (
    <ul>
      <li>src/</li>
      <li>  ├─ App.tsx</li>
      <li>  ├─ index.tsx</li>
      <li>  └─ components/</li>
    </ul>
  );
}

const CodeLayout: React.FC<DefaultLayoutProps> = ({ children }) => (
  <Layout
    footer={<CodeFooter />}
    headerActions={<CodeHeader />}
    sidebar={
      <Sidebar
        actions={
          <Button
            type={"secondary"}
            onClick={() => {}}
          >
            New
          </Button>
        }
        title="Explorer"
      >
        <FileExplorer />
      </Sidebar>
    }
    sidebarWidth={320}
  >
    {children}
  </Layout>
);

export default CodeLayout;