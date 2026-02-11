import type React from "react";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/Graph";
import { Sidebar } from "@/lib/layouts/Graph/Sidebar";
import { useConfirm } from "@/lib/providers/modal/useConfirm";

interface GraphLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const GraphLayout: React.FC<GraphLayoutProps> = ({
  children,
  title,
}) => {
  const confirm = useConfirm();
  const navigate = useNavigate();

  const onBackClick = useCallback(() => {
    confirm({ message: "Do you want to leave this page?" })
      .then((ok) => ok && void navigate("/dashboard"))
      .catch(() => {});
  }, [confirm, navigate]);

  const onSettingsClick = useCallback(() => {
    confirm({ message: "Do you want to leave this page?" })
      .then((ok) => ok && void navigate("/dashboard"))
      .catch(() => {});
  }, [confirm, navigate]);

  return (
    <Layout
      footer={<Footer />}
      headerActions={<Header />}
      sidebar={<Sidebar />}
      title={title}
      onBackClick={onBackClick}
      onSettingsClick={onSettingsClick}
    >
      {children}
    </Layout>
  );
};
