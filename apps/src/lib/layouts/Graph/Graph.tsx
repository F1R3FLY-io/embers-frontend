import type React from "react";
import { Layout } from "@/lib/layouts";
import type { FooterProps, HeaderProps } from "@/lib/layouts/Graph";
import { Footer, Header } from "@/lib/layouts/Graph";

interface GraphLayoutProps {
  children: React.ReactNode;
  footerProps: FooterProps;
  headerProps: HeaderProps;
}

export const GraphLayout: React.FC<GraphLayoutProps> = ({ children, footerProps, headerProps }) => (
  <Layout footer={<Footer {...footerProps} />} headerActions={<Header {...headerProps} />}>
    {children}
  </Layout>
);
