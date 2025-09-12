import type { HTMLAttributes, MouseEvent, ReactNode } from "react";

import classNames from "classnames";
import { forwardRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/lib/components/Button";

import styles from "./Modal.module.scss";

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  ariaLabel?: string;
  children: ReactNode;
  closeOnBlur?: boolean;
  closeOnEsc?: boolean;
  isOpen: boolean;
  maxWidth?: number | string;
  onClose: () => void;
  showCloseButton?: boolean;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      ariaLabel,
      children,
      className,
      closeOnBlur = true,
      closeOnEsc = true,
      isOpen,
      maxWidth = 720,
      onClose,
      showCloseButton = false,
      ...rest
    },
    ref,
  ) => {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const setRef = (node: HTMLDivElement) => {
      dialogRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && "current" in ref) {
        ref.current = node;
      }
    };

    useEffect(() => {
      if (!isOpen) {
        return;
      }
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen || !closeOnEsc) {
        return;
      }
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [isOpen, closeOnEsc, onClose]);

    const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
      if (!closeOnBlur) {
        return;
      }
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    if (!isOpen) {
      return null;
    }

    return createPortal(
      <div className={styles.overlay} onMouseDown={onBackdrop}>
        <div
          ref={setRef}
          aria-label={ariaLabel}
          aria-modal="true"
          className={classNames(styles.dialog, className)}
          role="dialog"
          style={{ maxWidth }}
          {...rest}
        >
          {showCloseButton && (
            <Button
              aria-label="Close"
              className={styles.close}
              type="secondary"
              onClick={onClose}
            >
              ×
            </Button>
          )}
          <div className={styles.content}>{children}</div>
        </div>
      </div>,
      document.getElementById("modal-root")!,
    );
  },
);

Modal.displayName = "Modal";
