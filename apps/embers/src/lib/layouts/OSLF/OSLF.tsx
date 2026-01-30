import type React from "react";

import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/OSLF";

interface OSLFLayoutProps {
  children: React.ReactNode;
}

export const OSLFLayout: React.FC<OSLFLayoutProps> = ({ children }) => (
  <Layout footer={<Footer />} headerActions={<Header />}>
    {children}
  </Layout>
);
