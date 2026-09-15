import type React from "react";

import { Button } from "@/lib/components/Button";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./ConfirmModal.module.scss";

type ConfirmModalProps = {
  /** Omit to render a single button: an acknowledgement rather than a choice. */
  cancelLabel?: string;
  confirmLabel: string;
  /** A node, not a string, so a dialog can list what it is about to affect. */
  message?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmModal = ({
  cancelLabel,
  confirmLabel,
  message,
  onCancel,
  onConfirm,
}: ConfirmModalProps) => {
  const { close } = useModal();

  const handleCancel = () => {
    onCancel();
    close();
  };

  const handleConfirm = () => {
    onConfirm();
    close();
  };

  return (
    <div className={styles.confirm}>
      {message ? (
        <Text className={styles.message} type="normal">
          {message}
        </Text>
      ) : null}

      <div className={styles.actions}>
        {cancelLabel === undefined ? null : (
          <Button type="secondary" onClick={handleCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button type="primary" onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
};
