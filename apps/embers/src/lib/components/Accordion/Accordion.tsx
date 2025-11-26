// Accordion.tsx
import type React from "react";

import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Text } from "@/lib/components/Text";

import styles from "./Accordion.module.scss";

export interface AccordionProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  closedIcon?: React.ReactNode;
  defaultOpen?: boolean;
  iconPosition?: "inline" | "end";
  onToggle?: (open: boolean) => void;
  openedIcon?: React.ReactNode;
  overflow?: "hidden" | "auto";
  persistKey?: string;
  title: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  actions,
  children,
  closedIcon,
  defaultOpen = false,
  iconPosition = "inline",
  onToggle,
  openedIcon,
  overflow = "auto",
  persistKey,
  title,
}) => {
  const initialOpen = useMemo(() => {
    if (!persistKey) {
      return defaultOpen;
    }
    try {
      const raw = localStorage.getItem(persistKey);
      return raw === null ? defaultOpen : raw === "true";
    } catch {
      return defaultOpen;
    }
  }, [persistKey, defaultOpen]);

  const [open, setOpen] = useState(initialOpen);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  }, [onToggle]);

  useEffect(() => {
    if (!persistKey) {
      return;
    }
    localStorage.setItem(persistKey, open.toString());
  }, [open, persistKey]);

  const openIcon = openedIcon ?? <i className="fa fa-chevron-down" />;
  const closeIcon = closedIcon ?? <i className="fa fa-chevron-up" />;

  return (
    <div>
      <div
        className={classNames(styles["accordion-header"], {
          [styles.open]: open,
          [styles["icon-end"]]: iconPosition === "end",
        })}
        onClick={toggleOpen}
      >
        <div className={styles["title-wrapper"]}>
          <Text bold color="primary" type="large">
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
          [styles["overflow-hidden"]]: overflow === "hidden",
        })}
      >
        {children}
      </div>
    </div>
  );
};
