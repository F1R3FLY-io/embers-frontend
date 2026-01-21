import type React from "react";

import { oslfCategories } from "@f1r3fly-io/oslf-editor";

import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/OSLF";
import { Sidebar } from "@/lib/layouts/OSLF/Sidebar";

interface OSLFLayoutProps {
  children: React.ReactNode;
}

export const OSLFLayout: React.FC<OSLFLayoutProps> = ({ children }) => (
  <Layout footer={<Footer />} sidebar={<Sidebar categories={oslfCategories} />}>
    {children}
  </Layout>
);
