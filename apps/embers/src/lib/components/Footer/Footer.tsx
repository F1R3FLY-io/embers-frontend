import type React from "react";

import styles from "./Footer.module.scss";

interface FooterProps {
  children: React.ReactNode;
}

const Footer: React.FC<FooterProps> = ({children}) => (
    <footer className={styles.footer}>
      {children}
    </footer>
  );

export default Footer;