import { useState } from "react";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import { Select } from "@/lib/components/Select";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";
import { activityReferenceFromJson } from "@/lib/workflow";

import styles from "../nodes/EditModal/EditModal.module.scss";

function textList(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.join(", ");
  }
  return fallback;
}

export function ExecutionPolicyModal({
  initial,
  onSave,
}: {
  initial: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const { close } = useModal();
  const [maxAttempts, setMaxAttempts] = useState(
    Number(initial.maxAttempts ?? 1),
  );
  const [initialDelayMillis, setInitialDelayMillis] = useState(
    Number(initial.initialDelayMillis ?? 1_000),
  );
  const [backoffMultiplierMillis, setBackoffMultiplierMillis] = useState(
    Number(initial.backoffMultiplierMillis ?? 2_000),
  );
  const [maxDelayMillis, setMaxDelayMillis] = useState(
    Number(initial.maxDelayMillis ?? 60_000),
  );
  const [timeoutMillis, setTimeoutMillis] = useState(
    Number(initial.timeoutMillis ?? 0),
  );
  const [maxOutputBytes, setMaxOutputBytes] = useState(
    Number(initial.policyMaxOutputBytes ?? 0),
  );
  const [retryOn, setRetryOn] = useState(
    textList(initial.retryOn, "failed, timedOut"),
  );
  // The Authorities control is hidden from the dialog because the field is
  // recorded-only today -- nothing in the runtime enforces it (see
  // docs/agent-teams/design/authority-enforcement.md). The value is still
  // read from the loaded definition and written back on save, so an existing
  // node's authorities round-trip losslessly; only the editing input is gone.
  const [authorities] = useState(textList(initial.policyAuthorities, ""));
  const [deterministicJitter, setDeterministicJitter] = useState(
    initial.deterministicJitter !== "false",
  );
  const [compensationJson, setCompensationJson] = useState(
    typeof initial.compensationJson === "string"
      ? initial.compensationJson
      : "null",
  );
  const [error, setError] = useState<string>();

  const numberField = (
    label: string,
    value: number,
    update: (value: number) => void,
    min: number,
  ) => (
    <label className={styles["nim-field"]}>
      <Text bold color="secondary" type="small">
        {label}
      </Text>
      <Input
        min={min}
        type="number"
        value={value}
        onChange={(event) => update(Math.max(min, Number(event.target.value)))}
      />
    </label>
  );

  return (
    <div className={styles["nim-modal"]}>
      <Text className={styles["nim-title"]} type="H2">
        Execution policy
      </Text>
      <Text>
        Retries use deterministic exponential backoff. A value of 1000 means a
        1× multiplier; 2000 means 2×.
      </Text>
      {error && <Text className={styles["nim-error"]}>{error}</Text>}
      {numberField("Maximum attempts", maxAttempts, setMaxAttempts, 1)}
      {numberField(
        "Initial retry delay (ms)",
        initialDelayMillis,
        setInitialDelayMillis,
        0,
      )}
      {numberField(
        "Backoff multiplier (thousandths)",
        backoffMultiplierMillis,
        setBackoffMultiplierMillis,
        1_000,
      )}
      {numberField(
        "Maximum retry delay (ms)",
        maxDelayMillis,
        setMaxDelayMillis,
        0,
      )}
      {numberField(
        "Activity timeout (ms, 0 disables)",
        timeoutMillis,
        setTimeoutMillis,
        0,
      )}
      {numberField(
        "Maximum output bytes (0 uses default)",
        maxOutputBytes,
        setMaxOutputBytes,
        0,
      )}
      <label className={styles["nim-field"]}>
        <Text bold color="secondary" type="small">
          Retry dispositions
        </Text>
        <Input
          value={retryOn}
          onChange={(event) => setRetryOn(event.target.value)}
        />
      </label>
      <div className={styles["nim-field"]}>
        <Select
          label="Deterministic retry jitter"
          options={[
            { label: "Enabled", value: "true" },
            { label: "Disabled", value: "false" },
          ]}
          value={String(deterministicJitter)}
          onChange={(value) => setDeterministicJitter(value === "true")}
        />
      </div>
      <label className={styles["nim-field"]}>
        <Text bold color="secondary" type="small">
          Compensation activity (Workflow JSON, or null)
        </Text>
        <Input
          textarea
          value={compensationJson}
          onChange={(event) => setCompensationJson(event.target.value)}
        />
      </label>
      <div className={styles["nim-actions"]}>
        <Button type="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={() => {
            try {
              if (
                compensationJson.trim() !== "" &&
                compensationJson.trim() !== "null"
              ) {
                activityReferenceFromJson(compensationJson);
              }
              onSave({
                ...initial,
                backoffMultiplierMillis,
                compensationJson,
                deterministicJitter: String(deterministicJitter),
                initialDelayMillis,
                maxAttempts,
                maxDelayMillis,
                policyAuthorities: authorities,
                policyMaxOutputBytes: maxOutputBytes,
                retryOn,
                timeoutMillis,
              });
              close();
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Invalid compensation activity.",
              );
            }
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
