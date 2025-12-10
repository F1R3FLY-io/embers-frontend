import type React from "react";

import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/Graph";
import { Sidebar } from "@/lib/layouts/Graph/Sidebar";
interface GraphLayoutProps {
  children: React.ReactNode;
}

export const GraphLayout: React.FC<GraphLayoutProps> = ({ children }) => (
  <Layout footer={<Footer />} headerActions={<Header />} sidebar={<Sidebar />}>
    {children}
  </Layout>
);
