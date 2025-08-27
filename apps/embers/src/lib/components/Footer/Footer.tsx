import type React from "react";

import styles from "./Footer.module.scss";

interface FooterProps {
  children: React.ReactNode;
}

export const Footer: React.FC<FooterProps> = ({ children }) => (
  <footer className={styles.footer}>{children}</footer>
);
