import type React from "react";

import classNames from "classnames";
import { useCallback, useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Accordion.module.scss";

interface AccordionProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  title: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  actions,
  children,
  defaultOpen = false,
  title,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <div>
      <div
        className={classNames(styles["accordion-header"], {
          [styles.open]: open,
        })}
        onClick={toggleOpen}
      >
        <Text color="primary" type="large">
          {title}
          <i className={open ? "fa fa-chevron-down" : "fa fa-chevron-up"} />
        </Text>
        <div className={styles.actions}>{actions}</div>
      </div>

      <div
        className={classNames(styles["accordion-content"], {
          [styles.open]: open,
        })}
      >
        {children}
      </div>
    </div>
  );
};
