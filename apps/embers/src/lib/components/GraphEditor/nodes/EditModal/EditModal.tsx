import classNames from "classnames";
import { useState } from "react";

import { Button } from "@/lib/components/Button";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./EditModal.module.scss";

export type ModalInput<T extends Record<string, string | number>> = {
  [K in keyof T]: {
    name: K;
    type: T[K] extends string
      ? "string"
      : T[K] extends number
        ? "number"
        : never;
  };
}[keyof T];

type EditModalProps<T extends Record<string, string | number>> = {
  initial: T;
  inputs: ModalInput<T>[];
  onCancel?: () => void;
  onSave: (data: T) => void;
};

export function EditModal<T extends Record<string, string | number>>({
  initial,
  onSave,
}: EditModalProps<T>) {
  const { close } = useModal();

  const [values] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);

    //@todo mb we need to add formik or something to work with validations and error states

    try {
      setSaving(true);
      onSave(values);
      close();
    } finally {
      // catch (e) {
      //   setError("Failed to save.");
      // }
      setSaving(false);
    }
  };

  // todo also we need to add an input component!!!
  return (
    <div className={styles["nim-modal"]}>
      <Text className={styles["nim-title"]} type="H2">
        Edit Manual Input Node
      </Text>
      {error && <Text className={styles["nim-error"]}>{error}</Text>}

      <div className={styles["nim-actions"]}>
        <Button
          className={classNames(styles["nim-btn"])}
          type="primary"
          onClick={handleSubmit}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          className={classNames(styles["nim-btn"], styles["nim-btn-cancel"])}
          type="subtle"
          onClick={close}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
