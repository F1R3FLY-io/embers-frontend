import { useState } from "react";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
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
      <label className={styles["nim-field"]}>
        <Text className={styles["nim-label"]}>Join policy</Text>
        <select
          value={joinMode}
          onChange={(event) => setJoinMode(event.target.value as JoinMode)}
        >
          <option value="all">Wait for every source</option>
          <option value="each">Run for each arrival</option>
          <option value="quorum">Run at quorum</option>
          <option value="race">Run for the first arrival</option>
          <option value="reduce">Reduce arrivals</option>
        </select>
      </label>
      <label className={styles["nim-field"]}>
        <Text className={styles["nim-label"]}>Correlation</Text>
        <select
          value={correlationMode}
          onChange={(event) =>
            setCorrelationMode(event.target.value as CorrelationMode)
          }
        >
          <option value="root">Root invocation</option>
          <option value="routeGroup">Route-group fork epoch</option>
          <option value="key">Value-path key</option>
        </select>
      </label>
      {correlationMode !== "root" && (
        <label className={styles["nim-field"]}>
          <Text className={styles["nim-label"]}>
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
          <Text className={styles["nim-label"]}>Quorum</Text>
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
        <label className={styles["nim-field"]}>
          <Text className={styles["nim-label"]}>Late arrivals</Text>
          <select
            value={late}
            onChange={(event) => setLate(event.target.value as LateMode)}
          >
            <option value="discard">Discard</option>
            <option value="cancel">Cancel the run</option>
            <option value="error">Fail the run</option>
          </select>
        </label>
      )}
      {joinMode === "reduce" && (
        <>
          <label className={styles["nim-field"]}>
            <Text className={styles["nim-label"]}>Reduce operation</Text>
            <select
              value={reduceOperation}
              onChange={(event) => setReduceOperation(event.target.value)}
            >
              <option value="collect">Collect</option>
              <option value="first">First</option>
              <option value="last">Last</option>
              <option value="sum">Sum</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
              <option value="mergeRecords">Merge records</option>
            </select>
          </label>
          <label className={styles["nim-field"]}>
            <Text className={styles["nim-label"]}>
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
        <Button type="subtle" onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
