import type { PropsWithChildren, ReactNode } from "react";

import { useCallback, useMemo, useRef, useState } from "react";

import { Modal } from "@/lib/components/Modal/Modal";

import type { ModalOptions } from "./useModal";

import { ModalContext } from "./useModal";

export type ResolvedModalOptions = {
  ariaLabel: string;
  closeOnBlur: boolean;
  closeOnEsc: boolean;
  maxWidth: number | string;
};
const defaultOptions: ResolvedModalOptions = {
  ariaLabel: "Dialog",
  closeOnBlur: true,
  closeOnEsc: true,
  maxWidth: 720,
};

export function ModalProvider({ children }: PropsWithChildren) {
  const [content, setContent] = useState<ReactNode | null>(null);
  const [opts, setOpts] = useState<ModalOptions>(defaultOptions);
  // The dismiss callback lives in a ref so `close` stays referentially stable
  // while still settling the CURRENT dialog's promise, whichever path closed
  // it. Nulled before invocation so it fires exactly once per dialog.
  const dismissRef = useRef<(() => void) | null>(null);

  const open = useCallback((node: ReactNode, options?: ModalOptions) => {
    dismissRef.current = options?.onDismiss ?? null;
    setOpts({ ...defaultOptions, ...options });
    setContent(node);
  }, []);

  const close = useCallback(() => {
    const dismiss = dismissRef.current;
    dismissRef.current = null;
    setContent(null);
    dismiss?.();
  }, []);

  const value = useMemo(
    () => ({ close, isOpen: content !== null, open }),
    [open, close, content],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        ariaLabel={opts.ariaLabel}
        closeOnBlur={opts.closeOnBlur ?? true}
        closeOnEsc={opts.closeOnEsc ?? true}
        isOpen={content !== null}
        maxWidth={opts.maxWidth}
        onClose={close}
      >
        {content}
      </Modal>
    </ModalContext.Provider>
  );
}
