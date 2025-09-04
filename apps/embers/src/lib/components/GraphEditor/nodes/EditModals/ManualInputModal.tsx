import classNames from "classnames";
import { useState } from "react";

import { Button } from "@/lib/components/Button";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./ManualInputModal.module.scss";

export type ManualInputType = "Text" | "JSON" | "Number" | "File";

export interface EditManualInputNodeValues {
  deploymentContainer: string;
  inputType: ManualInputType;
  nodeLabel: string;
  outputPortName: string;
}

export function ManualInputModal({
  initial,
  onSave,
}: {
  initial: EditManualInputNodeValues;
  onSave: (values: EditManualInputNodeValues) => void;
}) {
  const { close } = useModal();

  const [values, setValues] = useState<EditManualInputNodeValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof EditManualInputNodeValues>(
    key: K,
    v: EditManualInputNodeValues[K],
  ) => setValues((s) => ({ ...s, [key]: v }));

  const handleSubmit = () => {
    setError(null);

    //@todo mb we need to add formik or something to work with validations and error states

    if (!values.nodeLabel.trim()) {
      setError("Node label is required.");
      return;
    }
    if (!values.outputPortName.trim()) {
      setError("Output port name is required.");
      return;
    }

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
      <h2 className={styles["nim-title"]}>Edit Manual Input Node</h2>

      <div className={styles["nim-field"]}>
        <label className={styles["nim-label"]}>Node Label</label>
        <input
          className={styles["nim-input"]}
          placeholder="Manual Input"
          value={values.nodeLabel}
          onChange={(e) => update("nodeLabel", e.target.value)}
        />
      </div>

      {error && <div className={styles["nim-error"]}>{error}</div>}

      <div className={styles["nim-actions"]}>
        <Button
          className={classNames(styles["nim-btn"])}
          type="primary"
          onClick={handleSubmit}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          className={classNames(styles["nim-btn"])}
          type="secondary"
          onClick={close}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
