import { ContainerWithLogo } from "@/lib/components/ContainerWithLogo";
import { Text } from "@/lib/components/Text";
import styles from "./Create.module.scss";

export default function Create() {
  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <div className={styles.appTitle}>
          <Text type="title" fontSize={18}>F1R3FLY</Text>
        </div>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.dashboard}>
          {/* Dashboard content will be added here */}
          <div className={styles.dashboardDivider}></div>
        </div>
        <div className={styles.contentArea}>
          <div className={styles.contentHeader}>
            <Text type="title" fontSize={26}>Agents</Text>
          </div>
          <div className={styles.gridContainer}>
            <div className={`${styles.gridBox} ${styles.createBox}`}>
              <div className={styles.robotIcon}>
                <svg width="50" height="36" viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 22 A10 10 0 0 1 20 12 L25 12 A10 10 0 0 1 35 22" stroke="#6a00ff" strokeWidth="3" fill="none"/>
                  <line x1="33.5" y1="22" x2="37" y2="22" stroke="#6a00ff" strokeWidth="3"/>
                  <line x1="37" y1="22" x2="37" y2="26" stroke="#6a00ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="37" y1="26" x2="33.5" y2="26" stroke="#6a00ff" strokeWidth="3"/>
                  <line x1="35" y1="26" x2="35" y2="28.5" stroke="#6a00ff" strokeWidth="3" />
                  <path d="M35 26 A3 3 0 0 1 33.5 30" stroke="#6a00ff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="11.5" y1="30" x2="33.5" y2="30" stroke="#6a00ff" strokeWidth="3"/>
                  <path d="M10 26 A3 3 0 0 0 11.5 30" stroke="#6a00ff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="11.5" y1="26" x2="8" y2="26" stroke="#6a00ff" strokeWidth="3"/>
                  <line x1="8" y1="26" x2="8" y2="22" stroke="#6a00ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="8" y1="22" x2="11.5" y2="22" stroke="#6a00ff" strokeWidth="3"/>
                  <line x1="22.5" y1="12" x2="22.5" y2="6" stroke="#6a00ff" strokeWidth="3"/>
                  <circle cx="22.5" cy="6" r="3" fill="#6a00ff"/>
                  <circle cx="17" cy="23" r="3" fill="#6a00ff"/>
                  <circle cx="28" cy="23" r="3" fill="#6a00ff"/>
                </svg>
              </div>
              <Text type="secondary">Create new Agent</Text>
            </div>
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index + 1} className={styles.gridBox}>
                <Text type="secondary">{"Agent " + (index + 2)}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
