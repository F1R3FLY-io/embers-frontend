import type React from "react";

import { Footer } from "@/lib/components/Footer";
import { Header } from "@/lib/components/Header";

import styles from "./Layout.module.scss";

interface LayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarWidth?: number | string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  footer,
  headerActions,
  sidebar,
  sidebarWidth = 280,
}) => {
  const styleVar =
    typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth;

  return (
    <div
      className={styles.container}
      style={{ ["--sidebar-width" as string]: styleVar }}
    >
      <Header actions={headerActions} />

      <div className={styles.body}>
        {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}

        <div className={styles["content-area"]}>
          <main className={styles.main}>{children}</main>
          {footer && <Footer>{footer}</Footer>}
        </div>
      </div>
    </div>
  );
};
