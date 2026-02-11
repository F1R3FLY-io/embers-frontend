import type React from "react";

import classNames from "classnames";
import { useCallback, useState } from "react";

import { Footer } from "@/lib/components/Footer";
import { Header } from "@/lib/components/Header";

import styles from "./Layout.module.scss";

interface LayoutProps {
  children: React.ReactNode;
  collapsibleSidebar?: boolean;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  onBackClick: () => void;
  onSettingsClick: () => void;
  sidebar?: React.ReactNode;
  sidebarWidth?: number | string;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  collapsibleSidebar = true,
  footer,
  headerActions,
  onBackClick,
  onSettingsClick,
  sidebar,
  sidebarWidth = 280,
  title,
}) => {
  const styleVar = `${sidebarWidth}px`;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(
    () => setIsSidebarCollapsed((prev) => !prev),
    [],
  );

  return (
    <div
      className={classNames(styles.container, {
        [styles["is-collapsed"]]: isSidebarCollapsed,
      })}
      style={{ ["--sidebar-width" as string]: styleVar }}
    >
      <Header
        actions={headerActions}
        title={title}
        onBackClick={onBackClick}
        onSettingsClick={onSettingsClick}
      />

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
                  className={classNames("fa", {
                    "fa-chevron-left": !isSidebarCollapsed,
                    "fa-chevron-right": isSidebarCollapsed,
                  })}
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
