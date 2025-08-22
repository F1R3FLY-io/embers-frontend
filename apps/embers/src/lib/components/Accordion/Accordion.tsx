import type React from "react";

import { useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Accordion.module.scss";

interface AccordionProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  title: string;
}

const Accordion: React.FC<AccordionProps> = ({ actions, children, defaultOpen = false, title }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div
        className={`${styles.accordionHeader} ${open ? styles.open : ""}`}
        onClick={() => setOpen(!open)}
      >
          <Text fontSize={14} type={'title'}>
            {title}<i className={open ? "fa fa-chevron-down" : "fa fa-chevron-up"}/>
          </Text>
        <div className={styles.actions}>
          {actions}
        </div>
      </div>

      <div className={`${styles.accordionContent} ${open ? styles.open : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default Accordion;