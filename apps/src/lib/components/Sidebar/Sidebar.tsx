import type React from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Sidebar.module.scss";

interface SidebarProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ actions, children, title }) => {
  return (
    <div className={styles.container}>
      {(title || actions) && (
        <div className={styles.header}>
          <Text color="primary" type="H5">
            {title}
          </Text>
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
};
