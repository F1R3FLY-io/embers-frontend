import { Button } from "@/lib/components/Button";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./ConfirmModal.module.scss";

export const ConfirmModal = ({
  cancelLabel,
  confirmLabel,
  message,
  onCancel,
  onConfirm,
}: {
  cancelLabel: string;
  confirmLabel: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
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
      {message ? <Text className={styles.message} type="normal">{message}</Text> : null}

      <div className={styles.actions}>
        <Button type="secondary" onClick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button type="primary" onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
