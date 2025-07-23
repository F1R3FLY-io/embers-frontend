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
          <div className={styles.dashboardTop}>
            <button className={`${styles.iconButton} ${styles.agentsButton}`}>
              <svg className={styles.smallRobotIcon} width="25" height="13" viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 22 A10 10 0 0 1 20 12 L25 12 A10 10 0 0 1 35 22" stroke="white" strokeWidth="2" fill="none" />
                <line x1="33.5" y1="22" x2="37" y2="22" stroke="white" strokeWidth="2" />
                <line x1="37" y1="22" x2="37" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="37" y1="26" x2="33.5" y2="26" stroke="white" strokeWidth="2" />
                <line x1="35" y1="26" x2="35" y2="28.5" stroke="white" strokeWidth="2" />
                <path d="M35 26 A3 3 0 0 1 33.5 30" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="11.5" y1="30" x2="33.5" y2="30" stroke="white" strokeWidth="2" />
                <path d="M10 26 A3 3 0 0 0 11.5 30" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="11.5" y1="26" x2="8" y2="26" stroke="white" strokeWidth="2" />
                <line x1="8" y1="26" x2="8" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="22" x2="11.5" y2="22" stroke="white" strokeWidth="2" />
                <line x1="22.5" y1="12" x2="22.5" y2="6" stroke="white" strokeWidth="2" />
                <circle cx="22.5" cy="6" r="2" fill="white" />
                <circle cx="17" cy="23" r="2" fill="white" />
                <circle cx="28" cy="23" r="2" fill="white" />
              </svg>
              <span>Agents</span>
            </button>
          </div>
          <div className={styles.dashboardColumn}>
            <div className={styles.dashboardDivider}></div>
            <div className={styles.dashboardButtons}>
              <button className={styles.iconButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Documentation</span>
              </button>
              <button className={styles.iconButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        <div className={styles.contentArea}>
          <div className={styles.contentHeader}>
            <Text type="title" fontSize={26}>Agents</Text>
          </div>
          <div className={styles.gridContainer}>
            <div className={`${styles.gridBox} ${styles.createBox}`}>
              <div className={styles.robotIcon}>
                <svg width="50" height="36" viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 22 A10 10 0 0 1 20 12 L25 12 A10 10 0 0 1 35 22" stroke="#6a00ff" strokeWidth="3" fill="none" />
                  <line x1="33.5" y1="22" x2="37" y2="22" stroke="#6a00ff" strokeWidth="3" />
                  <line x1="37" y1="22" x2="37" y2="26" stroke="#6a00ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="37" y1="26" x2="33.5" y2="26" stroke="#6a00ff" strokeWidth="3" />
                  <line x1="35" y1="26" x2="35" y2="28.5" stroke="#6a00ff" strokeWidth="3" />
                  <path d="M35 26 A3 3 0 0 1 33.5 30" stroke="#6a00ff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="11.5" y1="30" x2="33.5" y2="30" stroke="#6a00ff" strokeWidth="3" />
                  <path d="M10 26 A3 3 0 0 0 11.5 30" stroke="#6a00ff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="11.5" y1="26" x2="8" y2="26" stroke="#6a00ff" strokeWidth="3" />
                  <line x1="8" y1="26" x2="8" y2="22" stroke="#6a00ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="8" y1="22" x2="11.5" y2="22" stroke="#6a00ff" strokeWidth="3" />
                  <line x1="22.5" y1="12" x2="22.5" y2="6" stroke="#6a00ff" strokeWidth="3" />
                  <circle cx="22.5" cy="6" r="3" fill="#6a00ff" />
                  <circle cx="17" cy="23" r="3" fill="#6a00ff" />
                  <circle cx="28" cy="23" r="3" fill="#6a00ff" />
                </svg>
              </div>
              <Text type="secondary">Create new Agent</Text>
            </div>
            {Array.from({ length: 0 }, (_, index) => (
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
