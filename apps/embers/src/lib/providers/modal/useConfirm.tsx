import type React from "react";

import { ConfirmModal } from "@/lib/components/Modal/ConfirmModal";
import { useModal } from "@/lib/providers/modal/useModal";

export type ConfirmOptions = {
  cancelLabel?: string;
  closeOnBlur?: boolean;
  closeOnEsc?: boolean;
  confirmLabel?: string;
  maxWidth?: number | string;
  message?: React.ReactNode;
  title?: string;
};

export function useConfirm() {
  const { open } = useModal();

  return async (opts: ConfirmOptions = {}): Promise<boolean> => {
    const {
      cancelLabel = "Cancel",
      closeOnBlur = false,
      closeOnEsc = true,
      confirmLabel = "Confirm",
      maxWidth = 300,
      message = "",
      title = "",
    } = opts;

    return new Promise<boolean>((resolve) => {
      open(
        <ConfirmModal
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          message={message}
          onCancel={() => resolve(false)}
          onConfirm={() => resolve(true)}
        />,
        {
          ariaLabel: title,
          closeOnBlur,
          closeOnEsc,
          maxWidth,
          showCloseButton: false,
        },
      );
    });
  };
}

export type AlertOptions = {
  confirmLabel?: string;
  maxWidth?: number | string;
  message?: React.ReactNode;
  title?: string;
};

/**
 * Tells the user something went wrong, and waits for them to acknowledge it.
 *
 * A modal rather than the dock log, because the dock is only rendered inside the
 * editor layouts: a message written to it from the dashboard goes somewhere the user
 * cannot see, which is the failure being fixed rather than a fix for it.
 */
export function useAlert() {
  const { open } = useModal();

  return async (opts: AlertOptions = {}): Promise<void> => {
    const {
      confirmLabel = "OK",
      maxWidth = 360,
      message = "",
      title = "",
    } = opts;

    return new Promise<void>((resolve) => {
      open(
        <ConfirmModal
          confirmLabel={confirmLabel}
          message={message}
          onCancel={() => resolve()}
          onConfirm={() => resolve()}
        />,
        { ariaLabel: title, closeOnBlur: true, closeOnEsc: true, maxWidth },
      );
    });
  };
}
