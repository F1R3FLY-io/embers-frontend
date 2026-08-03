import type { ReactNode } from "react";

import { createContext, useContext } from "react";

export type ModalOptions = {
  ariaLabel: string;
  closeOnBlur?: boolean;
  closeOnEsc?: boolean;
  maxWidth: number | string;
  /**
   * Invoked exactly once when the dialog closes by ANY path — Escape,
   * backdrop, the close button, or a programmatic close. Promise-based
   * dialogs (confirm/alert) settle their pending promise here so that a
   * dismissed dialog can never strand its caller; an explicit button
   * resolution earlier makes this a harmless no-op.
   */
  onDismiss?: () => void;
  showCloseButton?: boolean;
};

export interface ModalContextValue {
  close: () => void;
  isOpen: boolean;
  open: (content: ReactNode, options?: ModalOptions) => void;
}

export const ModalContext = createContext<ModalContextValue | undefined>(
  undefined,
);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return ctx;
};
