import type React from "react";

import type { HeaderProps } from "@/lib/layouts/Graph";

import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/Graph";
import { Sidebar } from "@/lib/layouts/Graph/Sidebar";
interface GraphLayoutProps {
  children: React.ReactNode;
  headerProps: HeaderProps;
}

export const GraphLayout: React.FC<GraphLayoutProps> = ({
  children,
  headerProps,
}) => (
  <Layout
    footer={<Footer />}
    headerActions={<Header {...headerProps} />}
    sidebar={<Sidebar />}
  >
    {children}
  </Layout>
);
