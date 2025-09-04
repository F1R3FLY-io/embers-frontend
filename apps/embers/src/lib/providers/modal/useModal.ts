import type { ReactNode } from "react";

import { createContext, useContext } from "react";

export type ModalOptions = {
  ariaLabel: string;
  closeOnBlur?: boolean;
  closeOnEsc?: boolean;
  maxWidth: number | string;
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
