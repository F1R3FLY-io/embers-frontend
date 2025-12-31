import { useState } from "react";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./PromptModal.module.scss";

export const PromptModal = ({
  cancelLabel,
  confirmLabel,
  inputLabel,
  inputPlaceholder,
  onCancel,
  onConfirm,
}: {
  cancelLabel: string;
  confirmLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  onCancel?: () => void;
  onConfirm?: (value: string) => void;
}) => {
  const { close } = useModal();

  const [value, setValue] = useState("");

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    close();
  };

  const handleConfirm = (value: string) => {
    if (onConfirm) {
      onConfirm(value);
    }
    close();
  };

  return (
    <div className={styles.confirm}>
      <div className={styles.inputs}>
        <Text color="secondary" type="small">
          {inputLabel}
        </Text>
        <Input
          inputType="input"
          placeholder={inputPlaceholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <Button type="secondary" onClick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button type="primary" onClick={() => handleConfirm(value)}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
};
