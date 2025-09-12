import type React from "react";

import classNames from "classnames";
import { useState } from "react";

import { Button } from "@/lib/components/Button";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./ManualInputModal.module.scss";

export type ManualInputData = Record<string, unknown>;

export type ManualInputModalProps = {
  initial: ManualInputData;
  onCancel?: (() => void) | undefined;
  onSave: (data: ManualInputData) => void;
};

export const ManualInputModal: React.FC<ManualInputModalProps> = ({
  initial,
  onSave,
}) => {
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
          type="secondary"
          onClick={close}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
