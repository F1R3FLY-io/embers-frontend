import type React from "react";

import styles from "./Sidebar.module.scss";
import { Text } from "@/lib/components/Text";

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
          <Text className={styles.title} fontSize={20} type={"title"}>
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

export default Sidebar;
