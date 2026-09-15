import { useState } from "react";

import type {
  Condition,
  ExecutionDisposition,
  ValuePath,
  WorkflowEdgeData,
} from "@/lib/workflow";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import { Select } from "@/lib/components/Select";
import { Text } from "@/lib/components/Text";
import {
  integerError,
  useFieldValidation,
} from "@/lib/forms/useFieldValidation";
import { useModal } from "@/lib/providers/modal/useModal";
import { conditionFromJson } from "@/lib/workflow";

import styles from "../nodes/EditModal/EditModal.module.scss";

type GuardKind = "always" | "compare" | "exists" | "json" | "rholang";
type LoopKind = "bounded" | "durable" | "none";

type Props = {
  initial: WorkflowEdgeData;
  onSave: (data: WorkflowEdgeData, label: string) => void;
};

const dispositions: ExecutionDisposition[] = [
  "completed",
  "failed",
  "timedOut",
  "cancelled",
  "skipped",
  "compensated",
  "iterationLimit",
  "rejected",
  "resourceExhausted",
];

function pathFrom(condition?: Condition): ValuePath {
  if (condition?.kind === "compare" && condition.left.kind === "path") {
    return condition.left;
  }
  if (condition?.kind === "exists" && condition.expression.kind === "path") {
    return condition.expression;
  }
  return { path: [], root: "output" };
}

function kindFrom(condition?: Condition): GuardKind {
  if (!condition || (condition.kind === "literal" && condition.value)) {
    return "always";
  }
  if (
    condition.kind === "compare" &&
    condition.left.kind === "path" &&
    condition.right.kind === "literal"
  ) {
    return "compare";
  }
  if (condition.kind === "exists" && condition.expression.kind === "path") {
    return "exists";
  }
  return condition.kind === "rholang" ? "rholang" : "json";
}

function literal(raw: string): boolean | number | string | null {
  try {
    const value: unknown = JSON.parse(raw);
    return value === null ||
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
      ? value
      : raw;
  } catch {
    return raw;
  }
}

function labelFor(data: WorkflowEdgeData): string {
  const trigger = data.trigger ?? "completed";
  const guard = data.guard;
  const condition = (() => {
    if (!guard || (guard.kind === "literal" && guard.value)) {
      return "always";
    }
    if (guard.kind === "compare") {
      const left =
        guard.left.kind === "path"
          ? `${guard.left.root}.${guard.left.path.join(".")}`.replace(/\.$/, "")
          : JSON.stringify(guard.left.value);
      const right =
        guard.right.kind === "literal"
          ? JSON.stringify(guard.right.value)
          : `${guard.right.root}.${guard.right.path.join(".")}`.replace(
              /\.$/,
              "",
            );
      return `${left} ${guard.operator} ${right}`;
    }
    return guard.kind;
  })();
  const loop = data.loop
    ? "maxIterations" in data.loop
      ? ` · ≤${data.loop.maxIterations}`
      : " · durable"
    : "";
  return `${trigger}: ${condition}${loop}`;
}

export function TransitionModal({ initial, onSave }: Props) {
  const { close } = useModal();
  const initialPath = pathFrom(initial.guard);
  const initialCompare =
    initial.guard?.kind === "compare" ? initial.guard : undefined;
  const initialTrigger = initial.trigger ?? "completed";
  const [trigger, setTrigger] = useState(
    initialTrigger.startsWith("custom:") ? "custom" : initialTrigger,
  );
  const [customTrigger, setCustomTrigger] = useState(
    initialTrigger.startsWith("custom:")
      ? initialTrigger.slice("custom:".length)
      : "",
  );
  const [routeMode, setRouteMode] = useState(initial.routeMode ?? "allMatches");
  const [noMatch, setNoMatch] = useState(initial.noMatch ?? "fail");
  const [priority, setPriority] = useState(initial.priority ?? 0);
  const [guardKind, setGuardKind] = useState<GuardKind>(
    kindFrom(initial.guard),
  );
  const [root, setRoot] = useState(initialPath.root);
  const [path, setPath] = useState(initialPath.path.join("."));
  const [operator, setOperator] = useState(initialCompare?.operator ?? "eq");
  const [compareValue, setCompareValue] = useState(
    initialCompare?.right.kind === "literal"
      ? JSON.stringify(initialCompare.right.value)
      : "true",
  );
  const [rhoSource, setRhoSource] = useState(
    initial.guard?.kind === "rholang"
      ? initial.guard.source
      : "$output == true",
  );
  const [rhoInputsJson, setRhoInputsJson] = useState(() =>
    JSON.stringify(
      initial.guard?.kind === "rholang"
        ? initial.guard.inputs
        : { output: { path: [], root: "output" } },
      undefined,
      2,
    ),
  );
  const [conditionJson, setConditionJson] = useState(() =>
    JSON.stringify(
      initial.guard ?? { kind: "literal", value: true },
      undefined,
      2,
    ),
  );
  const [error, setError] = useState<string>();
  const [loopKind, setLoopKind] = useState<LoopKind>(
    initial.loop
      ? "maxIterations" in initial.loop
        ? "bounded"
        : "durable"
      : "none",
  );
  const [maxIterations, setMaxIterations] = useState(
    initial.loop && "maxIterations" in initial.loop
      ? initial.loop.maxIterations
      : 10,
  );

  const validation = useFieldValidation({
    conditionJson: () => {
      if (guardKind === "json") {
        conditionFromJson(conditionJson);
      }
      return undefined;
    },
    customTrigger: () =>
      trigger === "custom" &&
      !/^[A-Za-z][A-Za-z0-9._-]{0,127}$/.test(customTrigger.trim())
        ? "A custom disposition must start with a letter and contain at most 128 letters, numbers, dots, underscores, or hyphens."
        : undefined,
    maxIterations: () =>
      loopKind === "bounded" ? integerError(maxIterations, 1) : undefined,
    priority: () => integerError(priority, 0),
    rhoInputsJson: () => {
      if (guardKind === "rholang") {
        conditionFromJson(
          JSON.stringify({
            inputs: JSON.parse(rhoInputsJson) as unknown,
            kind: "rholang",
            source: rhoSource,
          }),
        );
      }
      return undefined;
    },
    rhoSource: () =>
      guardKind === "rholang" && !rhoSource.trim()
        ? "Enter the Rholang guard source."
        : undefined,
  });
  const save = () => {
    if (!validation.validate()) {
      return;
    }
    setError(undefined);
    try {
      const normalizedTrigger =
        trigger === "custom"
          ? (() => {
              const name = customTrigger.trim();
              if (!/^[A-Za-z][A-Za-z0-9._-]{0,127}$/.test(name)) {
                throw new Error(
                  "A custom disposition must start with a letter and contain at most 128 letters, numbers, dots, underscores, or hyphens.",
                );
              }
              return `custom:${name}` as const;
            })()
          : (trigger as ExecutionDisposition);
      const valuePath: ValuePath = {
        path: path
          .split(".")
          .map((part) => part.trim())
          .filter(Boolean),
        root,
      };
      const guard: Condition | undefined = (() => {
        switch (guardKind) {
          case "always":
            return undefined;
          case "exists":
            return {
              expression: { kind: "path", ...valuePath },
              kind: "exists",
            };
          case "compare":
            return {
              kind: "compare",
              left: { kind: "path", ...valuePath },
              operator,
              right: { kind: "literal", value: literal(compareValue) },
            };
          case "rholang": {
            const sourceHash =
              initial.guard?.kind === "rholang" &&
              initial.guard.source === rhoSource
                ? initial.guard.sourceHash
                : undefined;
            return conditionFromJson(
              JSON.stringify({
                inputs: JSON.parse(rhoInputsJson) as unknown,
                kind: "rholang",
                source: rhoSource,
                sourceHash,
              }),
            );
          }
          case "json":
            return conditionFromJson(conditionJson);
        }
      })();
      const data: WorkflowEdgeData = {
        ...initial,
        guard,
        loop:
          loopKind === "bounded"
            ? { maxIterations }
            : loopKind === "durable"
              ? { durableYield: true }
              : undefined,
        noMatch,
        priority,
        routeMode,
        trigger: normalizedTrigger,
      };
      onSave(data, labelFor(data));
      close();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Invalid transition policy.",
      );
    }
  };

  return (
    <div className={styles["nim-modal"]}>
      <Text className={styles["nim-title"]} type="H2">
        Configure transition
      </Text>
      {error && (
        <Text className={styles["nim-error"]} role="alert">
          {error}
        </Text>
      )}

      <div className={styles["nim-field"]}>
        <Select
          label="Trigger"
          options={[
            ...dispositions.map((value) => ({ label: value, value })),
            { label: "Custom disposition", value: "custom" },
          ]}
          value={trigger}
          onChange={setTrigger}
        />
      </div>
      {trigger === "custom" && (
        <label className={styles["nim-field"]}>
          <Text bold color="secondary" type="small">
            Custom disposition
          </Text>
          <Input
            placeholder="reviewReady"
            {...validation.props("customTrigger")}
            value={customTrigger}
            onChange={(event) => setCustomTrigger(event.target.value)}
          />
        </label>
      )}
      <div className={styles["nim-field"]}>
        <Select
          label="Routing"
          options={[
            { label: "All matching routes", value: "allMatches" as const },
            { label: "First matching route", value: "firstMatch" as const },
          ]}
          value={routeMode}
          onChange={setRouteMode}
        />
      </div>
      <div className={styles["nim-field"]}>
        <Select
          label="When none match"
          options={[
            { label: "Fail", value: "fail" as const },
            {
              label: "Complete with current value",
              value: "complete" as const,
            },
            { label: "Skip", value: "skip" as const },
          ]}
          value={noMatch}
          onChange={setNoMatch}
        />
      </div>
      <label className={styles["nim-field"]}>
        <Text bold color="secondary" type="small">
          Priority
        </Text>
        <Input
          type="number"
          {...validation.props("priority")}
          value={priority}
          onChange={(event) => setPriority(Number(event.target.value))}
        />
      </label>
      <div className={styles["nim-field"]}>
        <Select
          label="Condition"
          options={[
            { label: "Always", value: "always" as const },
            { label: "Compare a value", value: "compare" as const },
            { label: "Value exists", value: "exists" as const },
            { label: "Pure Rholang expression", value: "rholang" as const },
            { label: "Compound condition", value: "json" as const },
          ]}
          value={guardKind}
          onChange={setGuardKind}
        />
      </div>
      {(guardKind === "compare" || guardKind === "exists") && (
        <>
          <div className={styles["nim-field"]}>
            <Select
              label="Value root"
              options={[
                { label: "Current output", value: "output" as const },
                { label: "Run input", value: "input" as const },
                { label: "Run state", value: "state" as const },
                { label: "Error", value: "error" as const },
              ]}
              value={root}
              onChange={setRoot}
            />
          </div>
          <label className={styles["nim-field"]}>
            <Text bold color="secondary" type="small">
              Path
            </Text>
            <Input
              placeholder="status.approved"
              value={path}
              onChange={(event) => setPath(event.target.value)}
            />
          </label>
        </>
      )}
      {guardKind === "compare" && (
        <>
          <div className={styles["nim-field"]}>
            <Select
              label="Comparison"
              options={(["eq", "ne", "gt", "ge", "lt", "le"] as const).map(
                (value) => ({ label: value, value }),
              )}
              value={operator}
              onChange={setOperator}
            />
          </div>
          <label className={styles["nim-field"]}>
            <Text bold color="secondary" type="small">
              Literal (JSON or text)
            </Text>
            <Input
              value={compareValue}
              onChange={(event) => setCompareValue(event.target.value)}
            />
          </label>
        </>
      )}
      {guardKind === "rholang" && (
        <>
          <label className={styles["nim-field"]}>
            <Text bold color="secondary" type="small">
              Pure expression
            </Text>
            <Input
              textarea
              {...validation.props("rhoSource")}
              value={rhoSource}
              onChange={(event) => setRhoSource(event.target.value)}
            />
          </label>
          <label className={styles["nim-field"]}>
            <Text bold color="secondary" type="small">
              Input bindings (Workflow JSON)
            </Text>
            <Input
              textarea
              {...validation.props("rhoInputsJson")}
              value={rhoInputsJson}
              onChange={(event) => setRhoInputsJson(event.target.value)}
            />
          </label>
        </>
      )}
      {guardKind === "json" && (
        <label className={styles["nim-field"]}>
          <Text bold color="secondary" type="small">
            Condition tree (Workflow JSON)
          </Text>
          <Input
            textarea
            {...validation.props("conditionJson")}
            value={conditionJson}
            onChange={(event) => setConditionJson(event.target.value)}
          />
        </label>
      )}
      <div className={styles["nim-field"]}>
        <Select
          label="Cycle progress"
          options={[
            { label: "Not a cycle edge", value: "none" as const },
            { label: "Bounded iterations", value: "bounded" as const },
            { label: "Durable yield", value: "durable" as const },
          ]}
          value={loopKind}
          onChange={setLoopKind}
        />
      </div>
      {loopKind === "bounded" && (
        <label className={styles["nim-field"]}>
          <Text bold color="secondary" type="small">
            Maximum iterations
          </Text>
          <Input
            type="number"
            {...validation.props("maxIterations")}
            value={maxIterations}
            onChange={(event) =>
              setMaxIterations(Math.max(1, Number(event.target.value)))
            }
          />
        </label>
      )}
      <div className={styles["nim-actions"]}>
        <Button type="secondary" onClick={close}>
          Cancel
        </Button>
        <Button type="primary" onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
