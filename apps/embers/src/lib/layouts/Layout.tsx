import type React from "react";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/lib/components/Footer";
import { Header } from "@/lib/components/Header";

import styles from "./Layout.module.scss";

interface LayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerClickAction?: () => void;
  sidebar?: React.ReactNode;
  sidebarWidth?: number | string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  footer,
  headerActions,
  headerClickAction,
  sidebar,
  sidebarWidth = 280,
}) => {
  const styleVar =
    typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth;

  const navigate = useNavigate();

  const headerClick = useCallback(() => {
    if (headerClickAction) {
      headerClickAction();
    } else {
      void navigate("/dashboard");
    }
  }, [headerClickAction, navigate]);

  return (
    <div
      className={styles.container}
      style={{ ["--sidebar-width" as string]: styleVar }}
    >
      <Header actions={headerActions} headerClick={headerClick} />

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
