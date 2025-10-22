import type React from "react";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/lib/components/Footer";
import { Header } from "@/lib/components/Header";
import { useLayout } from "@/lib/providers/layout/useLayout";

import styles from "./Layout.module.scss";

interface LayoutProps {
  children: React.ReactNode;
  collapsibleSidebar?: boolean;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerClickAction?: () => void;
  sidebar?: React.ReactNode;
  sidebarWidth?: number | string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  collapsibleSidebar = true,
  footer,
  headerActions,
  headerClickAction,
  sidebar,
  sidebarWidth = 280,
}) => {
  const styleVar = `${sidebarWidth}px`;

  const navigate = useNavigate();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const headerClick = useCallback(() => {
    if (headerClickAction) {
      headerClickAction();
    } else {
      void navigate("/dashboard");
    }
  }, [headerClickAction, navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  }, [isSidebarCollapsed, setIsSidebarCollapsed]);

  return (
    <div
      className={`${styles.container} ${isSidebarCollapsed ? styles["is-collapsed"] : ""}`}
      style={{ ["--sidebar-width" as string]: styleVar }}
    >
      <Header actions={headerActions} headerClick={headerClick} />

      <div className={styles.body}>
        {sidebar && (
          <>
            <aside className={styles.sidebar}>{sidebar}</aside>

            {collapsibleSidebar && (
              <button
                aria-label={
                  isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"
                }
                className={styles["collapse-toggle"]}
                type="button"
                onClick={toggleSidebar}
              >
                <i
                  className={`fa fa-chevron-${isSidebarCollapsed ? "right" : "left"}`}
                />
              </button>
            )}
          </>
        )}

        <div className={styles["content-area"]}>
          <main className={styles.main}>{children}</main>
          {footer && <Footer>{footer}</Footer>}
        </div>
      </div>
    </div>
  );
};
