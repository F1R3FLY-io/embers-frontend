import classNames from "classnames";
import { useState } from "react";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
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

/** Turns a data key into a readable label: `agentName` -> `Agent name`. */
function humanize(name: string) {
  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function EditModal<T extends Record<string, string | number>>({
  initial,
  inputs,
  onCancel,
  onSave,
}: EditModalProps<T>) {
  const { close } = useModal();

  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    name: keyof T,
    type: "number" | "string",
    raw: string,
  ) =>
    setValues((old) => ({
      ...old,
      // A half-typed number ("", "-") has no numeric value yet, so keep the
      // previous one rather than writing NaN into the node's data.
      [name]:
        type === "number"
          ? Number.isNaN(Number(raw))
            ? old[name]
            : Number(raw)
          : raw,
    }));

  const handleSubmit = () => {
    setError(null);
    setSaving(true);
    try {
      onSave(values);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    close();
  };

  return (
    <div className={styles["nim-modal"]}>
      <Text className={styles["nim-title"]} type="H2">
        Edit Manual Input Node
      </Text>
      {error && <Text className={styles["nim-error"]}>{error}</Text>}

      {inputs.map(({ name, type }) => (
        <label key={String(name)} className={styles["nim-field"]}>
          <Text className={styles["nim-label"]}>{humanize(String(name))}</Text>
          <Input
            className={styles["nim-input"]}
            type={type === "number" ? "number" : "text"}
            value={values[name]}
            onChange={(event) =>
              handleChange(
                name,
                type === "number" ? "number" : "string",
                event.target.value,
              )
            }
          />
        </label>
      ))}

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
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
