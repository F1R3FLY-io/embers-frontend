import type { PropsWithChildren, ReactNode } from "react";

import { useCallback, useMemo, useState } from "react";

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

  const open = useCallback((node: ReactNode, options?: ModalOptions) => {
    setOpts({ ...defaultOptions, ...(options ?? {}) });
    setContent(node);
  }, []);

  const close = useCallback(() => setContent(null), []);

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
