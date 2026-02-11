import type React from "react";

import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/OSLF";

interface OSLFLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const OSLFLayout: React.FC<OSLFLayoutProps> = ({ children, title }) => (
  <Layout
    footer={<Footer />}
    headerActions={<Header />}
    title={title}
    onBackClick={() => {}}
    onSettingsClick={() => {}}
  >
    {children}
  </Layout>
);
