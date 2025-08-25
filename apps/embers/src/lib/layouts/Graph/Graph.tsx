import type React from "react";

import { Layout } from "@/lib/layouts";
import { Header } from "@/lib/layouts/Graph";

interface GraphLayoutProps {
  children: React.ReactNode;
  onDeploy: () => void;
  onRun: () => void;
}

export const GraphLayout: React.FC<GraphLayoutProps> = ({
  children,
  onDeploy,
  onRun,
}) => (
  <Layout headerActions={<Header onDeploy={onDeploy} onRun={onRun} />}>
    {children}
  </Layout>
);
