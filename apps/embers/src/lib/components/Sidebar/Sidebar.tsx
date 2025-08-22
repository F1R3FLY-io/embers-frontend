import type React from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Sidebar.module.scss";

interface SidebarProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ actions, children, title }) => {
  return (
    <div className={styles.container}>
      {(title || actions) && (
        <div className={styles.header}>
          <Text fontSize={20}>{title}</Text>
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default Sidebar;
