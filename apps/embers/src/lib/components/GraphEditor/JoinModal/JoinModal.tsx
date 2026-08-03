import { useState } from "react";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import { Select } from "@/lib/components/Select";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";
import { conditionFromJson } from "@/lib/workflow";

import styles from "../nodes/EditModal/EditModal.module.scss";

type JoinMode = "all" | "each" | "quorum" | "race" | "reduce";
type LateMode = "cancel" | "discard" | "error";
type CorrelationMode = "key" | "root" | "routeGroup";

function textValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function conditionValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value !== undefined) {
    try {
      return JSON.stringify(value);
    } catch {
      return "Invalid non-JSON condition";
    }
  }
  return '{"kind":"literal","value":true}';
}

export function JoinModal({
  incomingCount,
  initial,
  onSave,
}: {
  incomingCount: number;
  initial: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const { close } = useModal();
  const [joinMode, setJoinMode] = useState<JoinMode>(
    (initial.joinMode as JoinMode | undefined) ?? "all",
  );
  const [quorum, setQuorum] = useState(
    Number(initial.quorum ?? Math.max(1, Math.ceil(incomingCount / 2))),
  );
  const [late, setLate] = useState<LateMode>(
    (initial.late as LateMode | undefined) ?? "discard",
  );
  const [correlationMode, setCorrelationMode] = useState<CorrelationMode>(
    (initial.correlationMode as CorrelationMode | undefined) ?? "root",
  );
  const [correlationValue, setCorrelationValue] = useState(
    textValue(initial.correlationValue, ""),
  );
  const [reduceOperation, setReduceOperation] = useState(
    textValue(initial.reduceOperation, "collect"),
  );
  const [reduceUntil, setReduceUntil] = useState(() =>
    conditionValue(initial.reduceUntil),
  );
  const [error, setError] = useState<string>();

  return (
    <div className={styles["nim-modal"]}>
      <Text className={styles["nim-title"]} type="H2">
        Configure fan-in
      </Text>
      <Text>
        This node currently has {incomingCount} incoming transition(s). Join
        state is correlated to one root workflow invocation.
      </Text>
      {error && <Text className={styles["nim-error"]}>{error}</Text>}
      <div className={styles["nim-field"]}>
        <Select
          label="Join policy"
          options={[
            { label: "Wait for every source", value: "all" as const },
            { label: "Run for each arrival", value: "each" as const },
            { label: "Run at quorum", value: "quorum" as const },
            { label: "Run for the first arrival", value: "race" as const },
            { label: "Reduce arrivals", value: "reduce" as const },
          ]}
          value={joinMode}
          onChange={setJoinMode}
        />
      </div>
      <div className={styles["nim-field"]}>
        <Select
          label="Correlation"
          options={[
            { label: "Root invocation", value: "root" as const },
            { label: "Route-group fork epoch", value: "routeGroup" as const },
            { label: "Value-path key", value: "key" as const },
          ]}
          value={correlationMode}
          onChange={setCorrelationMode}
        />
      </div>
      {correlationMode !== "root" && (
        <label className={styles["nim-field"]}>
          <Text bold color="secondary" type="small">
            {correlationMode === "routeGroup"
              ? "Route-group id"
              : "Key path (for example state.orderId)"}
          </Text>
          <Input
            value={correlationValue}
            onChange={(event) => setCorrelationValue(event.target.value)}
          />
        </label>
      )}
      {joinMode === "quorum" && (
        <label className={styles["nim-field"]}>
          <Text bold color="secondary" type="small">
            Quorum
          </Text>
          <Input
            max={Math.max(1, incomingCount)}
            min={1}
            type="number"
            value={quorum}
            onChange={(event) =>
              setQuorum(
                Math.min(
                  Math.max(1, incomingCount),
                  Math.max(1, Number(event.target.value)),
                ),
              )
            }
          />
        </label>
      )}
      {(joinMode === "quorum" || joinMode === "race") && (
        <div className={styles["nim-field"]}>
          <Select
            label="Late arrivals"
            options={[
              { label: "Discard", value: "discard" as const },
              { label: "Cancel the run", value: "cancel" as const },
              { label: "Fail the run", value: "error" as const },
            ]}
            value={late}
            onChange={setLate}
          />
        </div>
      )}
      {joinMode === "reduce" && (
        <>
          <div className={styles["nim-field"]}>
            <Select
              label="Reduce operation"
              options={[
                { label: "Collect", value: "collect" },
                { label: "First", value: "first" },
                { label: "Last", value: "last" },
                { label: "Sum", value: "sum" },
                { label: "Minimum", value: "min" },
                { label: "Maximum", value: "max" },
                { label: "Merge records", value: "mergeRecords" },
              ]}
              value={reduceOperation}
              onChange={setReduceOperation}
            />
          </div>
          <label className={styles["nim-field"]}>
            <Text bold color="secondary" type="small">
              Until condition (Workflow JSON)
            </Text>
            <Input
              value={reduceUntil}
              onChange={(event) => setReduceUntil(event.target.value)}
            />
          </label>
        </>
      )}
      <div className={styles["nim-actions"]}>
        <Button type="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={() => {
            try {
              if (joinMode === "reduce") {
                conditionFromJson(reduceUntil);
              }
              onSave({
                ...initial,
                correlationMode,
                correlationValue,
                joinMode,
                late,
                quorum,
                reduceOperation,
                reduceUntil,
              });
              close();
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Invalid reduce condition.",
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
