import type { ReactNode } from "react";

import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./FormModal.module.scss";

type FormModalProps<T> = {
  component: (onSubmit: (value: T) => void, onCancel: () => void) => ReactNode;
  onCancel: () => void;
  onSubmit: (value: T) => void;
};

export function FormModal<T>({
  component,
  onCancel,
  onSubmit,
}: FormModalProps<T>) {
  const { close } = useModal();

  const handleCancel = () => {
    onCancel();
    close();
  };

  const handleConfirm = (value: T) => {
    onSubmit(value);
    close();
  };

  return (
    <div className={styles.confirm}>
      {component(handleConfirm, handleCancel)}
    </div>
  );
}
