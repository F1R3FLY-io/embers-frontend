import type React from "react";

import classNames from "classnames";
import { useCallback, useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Accordion.module.scss";

export interface AccordionProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  closedIcon?: React.ReactNode;
  defaultOpen?: boolean;
  iconPosition?: "inline" | "end";
  openedIcon?: React.ReactNode;
  title: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  actions,
  children,
  className,
  closedIcon,
  defaultOpen = false,
  iconPosition = 'inline',
  openedIcon,
  title,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);

  const openIcon = openedIcon ?? <i className="fa fa-chevron-down" />;
  const closeIcon = closedIcon ?? <i className="fa fa-chevron-up" />;
  return (
    <div className={className}>
      <div
        className={classNames(styles["accordion-header"], {
          [styles.open]: open,
          [styles["icon-end"]]: iconPosition === "end",
        })}
        onClick={toggleOpen}
      >
        <div className={styles['title-wrapper']}>
          <Text color="primary" type="large">
            {title}
          </Text>
          {iconPosition === "inline" && (open ? openIcon : closeIcon)}
        </div>

        {iconPosition === "end" && (
          <div className={styles.icon}>{open ? openIcon : closeIcon}</div>
        )}
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
