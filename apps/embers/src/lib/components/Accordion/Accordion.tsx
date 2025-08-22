import type React from "react";

import { useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Accordion.module.scss";
import classNames from "classnames";

interface AccordionProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  title: string;
}

const Accordion: React.FC<AccordionProps> = ({
  actions,
  children,
  defaultOpen = false,
  title,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const className = classNames(styles["accordion-header"], {[styles.open]: open});
  return (
    <div>
      <div
        className={className}
        onClick={() => setOpen(!open)}
      >
        <Text type="H4">
          {title}
          <i className={open ? "fa fa-chevron-down" : "fa fa-chevron-up"} />
        </Text>
        <div className={styles.actions}>{actions}</div>
      </div>

      <div
        className={`${styles["accordion-content"]} ${open ? styles.open : ""}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Accordion;
