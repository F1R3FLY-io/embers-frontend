import type React from "react";

import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";

import { Footer } from "@/lib/components/Footer";
import { Header } from "@/lib/components/Header";

import styles from "./Layout.module.scss";

interface LayoutProps {
  children: React.ReactNode;
  collapsibleRightSidebar?: boolean;
  collapsibleSidebar?: boolean;
  defaultRightSidebarOpen?: boolean;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  isRightSidebarOpen?: boolean;
  onBackClick: () => void;
  onRightSidebarOpenChange?: (open: boolean) => void;

  onSettingsClick: () => void;
  rightSidebar?: React.ReactNode;
  rightSidebarWidth?: number | string;
  sidebar?: React.ReactNode;
  sidebarWidth?: number | string;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  collapsibleRightSidebar = true,
  collapsibleSidebar = true,
  defaultRightSidebarOpen = false,
  footer,
  headerActions,
  isRightSidebarOpen,
  onBackClick,
  onRightSidebarOpenChange,

  onSettingsClick,
  rightSidebar,
  rightSidebarWidth = 360,
  sidebar,
  sidebarWidth = 280,
  title,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [rightOpenInternal, setRightOpenInternal] = useState(
    defaultRightSidebarOpen,
  );

  const rightOpen =
    typeof isRightSidebarOpen === "boolean"
      ? isRightSidebarOpen
      : rightOpenInternal;

  const setRightOpen = useCallback(
    (open: boolean) => {
      onRightSidebarOpenChange?.(open);
      if (typeof isRightSidebarOpen !== "boolean") {
        setRightOpenInternal(open);
      }
    },
    [isRightSidebarOpen, onRightSidebarOpenChange],
  );

  const toggleSidebar = useCallback(
    () => setIsSidebarCollapsed((prev) => !prev),
    [],
  );

  const toggleRightSidebar = useCallback(
    () => setRightOpen(!rightOpen),
    [rightOpen, setRightOpen],
  );

  const containerClassName = useMemo(
    () =>
      classNames(styles.container, {
        [styles["is-collapsed"]]: isSidebarCollapsed,
        [styles["is-right-collapsed"]]: rightSidebar && !rightOpen,
      }),
    [isSidebarCollapsed, rightOpen, rightSidebar],
  );

  return (
    <div
      className={containerClassName}
      style={
        {
          ["--right-sidebar-width" as string]: `${rightSidebarWidth}px`,
          ["--sidebar-width" as string]: `${sidebarWidth}px`,
        } as React.CSSProperties
      }
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

        {rightSidebar && (
          <>
            <aside className={styles["right-sidebar"]}>{rightSidebar}</aside>

            {collapsibleRightSidebar && (
              <button
                aria-label={
                  rightOpen ? "Hide right sidebar" : "Show right sidebar"
                }
                className={styles["right-collapse-toggle"]}
                type="button"
                onClick={toggleRightSidebar}
              >
                <i
                  className={classNames("fa", {
                    "fa-chevron-left": !rightOpen,
                    "fa-chevron-right": rightOpen,
                  })}
                />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
