import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import type {
  ActivityReference,
  Condition,
  WorkflowDefinitionV2,
  WorkflowTransition,
} from "./types";

export type WorkflowDiagnostic = {
  code: string;
  id?: string;
  message: string;
  severity: "error" | "warning";
};

const standardDispositions = new Set([
  "cancelled",
  "compensated",
  "completed",
  "failed",
  "iterationLimit",
  "rejected",
  "resourceExhausted",
  "skipped",
  "timedOut",
]);

function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function sha256Hex(source: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(source)));
}

function authorityDiagnostics(
  authorities: string[],
  id: string,
  label: string,
): WorkflowDiagnostic[] {
  const diagnostics: WorkflowDiagnostic[] = [];
  const seen = new Set<string>();
  for (const authority of authorities) {
    if (authority.trim() === "") {
      diagnostics.push({
        code: "empty-authority",
        id,
        message: `${label} cannot contain an empty authority.`,
        severity: "error",
      });
    } else if (seen.has(authority)) {
      diagnostics.push({
        code: "duplicate-authority",
        id,
        message: `${label} declares authority ${authority} more than once.`,
        severity: "error",
      });
    }
    seen.add(authority);
  }
  return diagnostics;
}

function triggerDiagnostics(
  trigger: string,
  transitionId: string,
): WorkflowDiagnostic[] {
  if (
    standardDispositions.has(trigger) ||
    /^custom:[A-Za-z][A-Za-z0-9._-]{0,127}$/.test(trigger)
  ) {
    return [];
  }
  return [
    {
      code: "invalid-transition-trigger",
      id: transitionId,
      message: `Transition ${transitionId} must use a standard disposition or custom:<safe-name>.`,
      severity: "error",
    },
  ];
}

function conditionDiagnostics(
  condition: Condition,
  transitionId: string,
): WorkflowDiagnostic[] {
  switch (condition.kind) {
    case "all":
    case "any":
      return [
        ...(condition.operands.length === 0
          ? [
              {
                code: "empty-compound-condition",
                id: transitionId,
                message: `A ${condition.kind} condition needs at least one operand.`,
                severity: "error" as const,
              },
            ]
          : []),
        ...condition.operands.flatMap((operand) =>
          conditionDiagnostics(operand, transitionId),
        ),
      ];
    case "not":
      return conditionDiagnostics(condition.operand, transitionId);
    case "compare":
    case "exists":
    case "literal":
      return [];
    case "rholang": {
      const diagnostics: WorkflowDiagnostic[] = [];
      const source = condition.source.trim();
      const report = (code: string, message: string) =>
        diagnostics.push({
          code,
          id: transitionId,
          message,
          severity: "error",
        });

      if (source === "") {
        report(
          "empty-rholang-guard",
          "A custom Rholang guard cannot be empty.",
        );
        return diagnostics;
      }
      if (source.length > 4096) {
        report(
          "oversize-rholang-guard",
          "A custom Rholang guard cannot exceed 4096 characters.",
        );
      }
      if (
        condition.sourceHash !== undefined &&
        condition.sourceHash !== sha256Hex(condition.source)
      ) {
        report(
          "mismatched-rholang-guard-hash",
          "A pinned Rholang guard hash must exactly equal the lowercase SHA-256 digest of its source bytes.",
        );
      }
      if (
        source.includes("!(") ||
        source.includes("!!") ||
        source.includes("?(") ||
        source.includes("`")
      ) {
        report(
          "effectful-rholang-guard",
          "A custom Rholang guard cannot send, receive, or contain a URI literal.",
        );
      }

      const tokens = new Set(source.split(/[^A-Za-z0-9_]+/).filter(Boolean));
      const forbidden = [
        "new",
        "for",
        "contract",
        "bundle",
        "match",
        "stdout",
        "registry",
      ];
      const effectfulToken = forbidden.find((token) => tokens.has(token));
      if (effectfulToken) {
        report(
          "effectful-rholang-guard",
          `A custom Rholang guard cannot contain ${effectfulToken}.`,
        );
      }

      const references = new Set(
        [...source.matchAll(/\$([A-Za-z0-9_]+)/g)].map((match) => match[1]),
      );
      if (source.replace(/\$[A-Za-z0-9_]+/g, "").includes("$")) {
        report(
          "invalid-rholang-input",
          "Every $ in a custom Rholang guard must introduce a declared input.",
        );
      }
      for (const name of Object.keys(condition.inputs)) {
        if (!/^[A-Za-z0-9_]+$/.test(name)) {
          report(
            "invalid-rholang-input",
            `Guard input ${name} is not a safe identifier.`,
          );
        } else if (!references.has(name)) {
          report(
            "unused-rholang-input",
            `Guard input ${name} is declared but unused.`,
          );
        }
      }
      for (const name of references) {
        if (!(name in condition.inputs)) {
          report(
            "undeclared-rholang-input",
            `Guard input $${name} is not declared.`,
          );
        }
      }
      return diagnostics;
    }
    default:
      return [];
  }
}

function activityDiagnostics(
  activity: ActivityReference,
  id: string,
  label: string,
): WorkflowDiagnostic[] {
  switch (activity.kind) {
    case "agent":
      return activity.agentId.trim() === "" ||
        activity.agentVersion.trim() === ""
        ? [
            {
              code: "missing-agent-reference",
              id,
              message: `${label} must pin an agent id and version.`,
              severity: "error",
            },
          ]
        : [];
    case "rholang":
      return activity.uri.startsWith("rho:id:") &&
        activity.uri.length > "rho:id:".length
        ? []
        : [
            {
              code: "invalid-rholang-uri",
              id,
              message: `${label} must name a rho:id: registry URI.`,
              severity: "error",
            },
          ];
    case "workflow":
      return activity.teamId.startsWith("rho:id:") &&
        activity.teamId.length > "rho:id:".length &&
        activity.version.trim() !== ""
        ? []
        : [
            {
              code: "invalid-workflow-reference",
              id,
              message: `${label} must pin a deployed rho:id: URI and definition hash.`,
              severity: "error",
            },
          ];
    case "foreign-term": {
      const abi = activity.abi as {
        entrypoint: unknown;
        inputBinding: unknown;
        outputBinding: unknown;
        version: unknown;
      };
      return [
        ...(abi.version === "flt-v1" &&
        typeof abi.entrypoint === "string" &&
        abi.entrypoint.trim() !== "" &&
        typeof abi.inputBinding === "string" &&
        abi.inputBinding.trim() !== "" &&
        typeof abi.outputBinding === "string" &&
        abi.outputBinding.trim() !== ""
          ? []
          : [
              {
                code: "invalid-foreign-term-abi",
                id,
                message: `${label} needs the flt-v1 ABI and non-empty entrypoint and bindings.`,
                severity: "error" as const,
              },
            ]),
        ...(activity.source !== "" &&
        new TextEncoder().encode(activity.source).byteLength <= 1_048_576 &&
        !activity.source.includes("`") &&
        activity.artifactHash === sha256Hex(activity.source)
          ? []
          : [
              {
                code: "invalid-foreign-term-source",
                id,
                message: `${label} needs 1..1048576 safe source bytes and its exact lowercase SHA-256 artifact hash.`,
                severity: "error" as const,
              },
            ]),
        ...(/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(activity.languageTag) &&
        activity.languageSpecificationHash.trim() !== ""
          ? []
          : [
              {
                code: "invalid-foreign-term-language",
                id,
                message: `${label} needs a registered language tag and pinned language specification hash.`,
                severity: "error" as const,
              },
            ]),
        ...(isPositiveSafeInteger(activity.resources.fuel) &&
        isPositiveSafeInteger(activity.resources.maxOutputBytes) &&
        isPositiveSafeInteger(activity.resources.maxPhlo)
          ? []
          : [
              {
                code: "invalid-foreign-term-resources",
                id,
                message: `${label} resource limits must be positive safe integers.`,
                severity: "error" as const,
              },
            ]),
        ...authorityDiagnostics(activity.authorities, id, label),
      ];
    }
    case "builtin":
      return [];
  }
}

function stronglyConnectedComponents(
  nodeIds: string[],
  transitions: WorkflowTransition[],
): string[][] {
  const adjacency = new Map(nodeIds.map((id) => [id, [] as string[]]));
  for (const { sourceNodeId, targetNodeId } of transitions) {
    adjacency.get(sourceNodeId)?.push(targetNodeId);
  }

  let nextIndex = 0;
  const indexes = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const result: string[][] = [];

  const visit = (nodeId: string) => {
    indexes.set(nodeId, nextIndex);
    lowLinks.set(nodeId, nextIndex);
    nextIndex += 1;
    stack.push(nodeId);
    onStack.add(nodeId);

    for (const target of adjacency.get(nodeId) ?? []) {
      if (!indexes.has(target)) {
        visit(target);
        lowLinks.set(
          nodeId,
          Math.min(lowLinks.get(nodeId)!, lowLinks.get(target)!),
        );
      } else if (onStack.has(target)) {
        lowLinks.set(
          nodeId,
          Math.min(lowLinks.get(nodeId)!, indexes.get(target)!),
        );
      }
    }

    if (lowLinks.get(nodeId) === indexes.get(nodeId)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
      } while (member !== nodeId);
      result.push(component);
    }
  };

  for (const nodeId of nodeIds) {
    if (!indexes.has(nodeId)) {
      visit(nodeId);
    }
  }
  return result;
}

export function validateWorkflow(
  definition: WorkflowDefinitionV2,
): WorkflowDiagnostic[] {
  const diagnostics: WorkflowDiagnostic[] = [];
  const nodeIds = new Set(Object.keys(definition.nodes));
  const scopeOwners = new Map<string, string[]>();
  const validateIdentityMap = (
    kind: string,
    values: Record<string, { id: string } | undefined>,
  ) => {
    for (const [key, value] of Object.entries(values)) {
      if (!value || key !== value.id) {
        diagnostics.push({
          code: "identity-map-mismatch",
          id: key,
          message: `${kind} map key ${key} must equal its embedded id${value ? ` ${value.id}` : ""}.`,
          severity: "error",
        });
      }
    }
  };
  validateIdentityMap("Node", definition.nodes);
  validateIdentityMap("Scope", definition.scopes);
  validateIdentityMap("Route group", definition.routeGroups);
  validateIdentityMap("Transition", definition.transitions);

  if (!(definition.entryScopeId in definition.scopes)) {
    diagnostics.push({
      code: "missing-entry-scope",
      id: definition.entryScopeId,
      message: `Entry scope ${definition.entryScopeId} does not exist.`,
      severity: "error",
    });
  }

  for (const node of Object.values(definition.nodes)) {
    if (!(node.scopeId in definition.scopes)) {
      diagnostics.push({
        code: "missing-node-scope",
        id: node.id,
        message: `Node ${node.label} refers to missing scope ${node.scopeId}.`,
        severity: "error",
      });
    }
    if (node.kind === "activity") {
      diagnostics.push(
        ...activityDiagnostics(
          node.activity,
          node.id,
          `Activity ${node.label}`,
        ),
      );
    }
    if (node.kind === "scope") {
      const owners = scopeOwners.get(node.childScopeId) ?? [];
      owners.push(node.id);
      scopeOwners.set(node.childScopeId, owners);
      if (node.childScopeId === definition.entryScopeId) {
        diagnostics.push({
          code: "root-scope-owned-by-node",
          id: node.id,
          message: `Scope node ${node.label} cannot own the root scope.`,
          severity: "error",
        });
      }
    }
    if (node.kind === "approval") {
      diagnostics.push(
        ...authorityDiagnostics(
          node.approvers,
          node.id,
          `Approval ${node.label}`,
        ),
      );
      if (
        !isPositiveSafeInteger(node.quorum) ||
        node.quorum > Math.max(1, node.approvers.length)
      ) {
        diagnostics.push({
          code: "invalid-approval-quorum",
          id: node.id,
          message: `Approval ${node.label} quorum must be positive and cannot exceed its explicit approver set.`,
          severity: "error",
        });
      }
      if (
        node.policy?.timeout !== undefined &&
        !Object.values(definition.transitions).some(
          (transition) =>
            transition.sourceNodeId === node.id &&
            transition.trigger === "timedOut",
        )
      ) {
        diagnostics.push({
          code: "approval-timeout-unrouted",
          id: node.id,
          message: `Approval ${node.label} declares a timeout but no timedOut route; the deadline would expire into a run failure with no matching route group.`,
          severity: "error",
        });
      }
    }
    if (node.kind === "wait") {
      if (node.waitFor === "timer") {
        const hasDelay = node.timer?.delayMillis !== undefined;
        const hasDeadline = node.timer?.deadline !== undefined;
        if (!node.timer || hasDelay === hasDeadline) {
          diagnostics.push({
            code: "invalid-timer-policy",
            id: node.id,
            message: `Timer ${node.label} needs exactly one delay or deadline.`,
            severity: "error",
          });
        }
        if (
          node.timer?.delayMillis !== undefined &&
          !isPositiveSafeInteger(node.timer.delayMillis)
        ) {
          diagnostics.push({
            code: "invalid-timer-delay",
            id: node.id,
            message: `Timer ${node.label} delay must be a positive safe integer.`,
            severity: "error",
          });
        }
        if (node.signal !== undefined) {
          diagnostics.push({
            code: "timer-has-signal",
            id: node.id,
            message: `Timer ${node.label} cannot also declare a signal.`,
            severity: "error",
          });
        }
      } else if (node.timer) {
        diagnostics.push({
          code: "unexpected-timer-policy",
          id: node.id,
          message: `Non-timer wait ${node.label} cannot carry a timer policy.`,
          severity: "error",
        });
      }
      if (
        node.waitFor !== "timer" &&
        node.signal !== undefined &&
        node.signal.trim() === ""
      ) {
        diagnostics.push({
          code: "empty-wait-signal",
          id: node.id,
          message: `Wait ${node.label} cannot declare an empty signal.`,
          severity: "error",
        });
      }
    }
    diagnostics.push(
      ...authorityDiagnostics(
        node.policy?.authorities ?? [],
        node.id,
        `Node ${node.label}`,
      ),
    );
    if (node.policy?.retry) {
      const retry = node.policy.retry;
      if (
        !isPositiveSafeInteger(retry.maxAttempts) ||
        !isNonNegativeSafeInteger(retry.initialDelayMillis) ||
        !isPositiveSafeInteger(retry.backoffMultiplierMillis) ||
        retry.backoffMultiplierMillis < 1_000 ||
        !isNonNegativeSafeInteger(retry.maxDelayMillis) ||
        retry.initialDelayMillis > retry.maxDelayMillis
      ) {
        diagnostics.push({
          code: "invalid-retry-policy",
          id: node.id,
          message: `Node ${node.label} has an invalid retry bound or backoff policy.`,
          severity: "error",
        });
      }
    }
    if (
      node.policy?.timeout &&
      !isPositiveSafeInteger(node.policy.timeout.afterMillis)
    ) {
      diagnostics.push({
        code: "invalid-timeout-policy",
        id: node.id,
        message: `Node ${node.label} timeout must be positive.`,
        severity: "error",
      });
    }
    if (
      node.policy?.maxOutputBytes !== undefined &&
      !isPositiveSafeInteger(node.policy.maxOutputBytes)
    ) {
      diagnostics.push({
        code: "invalid-output-bound",
        id: node.id,
        message: `Node ${node.label} output bound must be positive.`,
        severity: "error",
      });
    }
    if (node.policy?.compensation) {
      diagnostics.push(
        ...activityDiagnostics(
          node.policy.compensation,
          node.id,
          `Compensation for ${node.label}`,
        ),
      );
    }
    if (node.join?.mode === "reduce") {
      diagnostics.push(...conditionDiagnostics(node.join.until, node.id));
    }
    if (node.join?.mode === "quorum") {
      const incoming = Object.values(definition.transitions).filter(
        ({ targetNodeId }) => targetNodeId === node.id,
      ).length;
      if (
        !isPositiveSafeInteger(node.join.quorum) ||
        node.join.quorum > incoming
      ) {
        diagnostics.push({
          code: "invalid-quorum",
          id: node.id,
          message: `Node ${node.label} quorum ${node.join.quorum} must be between 1 and its ${incoming} incoming transitions.`,
          severity: "error",
        });
      }
    }
    if (
      node.join?.correlation.kind === "routeGroup" &&
      !(node.join.correlation.routeGroupId in definition.routeGroups)
    ) {
      diagnostics.push({
        code: "missing-correlation-route-group",
        id: node.id,
        message: `Node ${node.label} correlates on a missing route group.`,
        severity: "error",
      });
    }
  }

  const entryScope = Object.values(definition.scopes).find(
    ({ id }) => id === definition.entryScopeId,
  );
  if (entryScope && entryScope.kind !== "root") {
    diagnostics.push({
      code: "invalid-entry-scope-kind",
      id: entryScope.id,
      message: "The entry scope must have kind root.",
      severity: "error",
    });
  }
  if (entryScope?.parentScopeId !== undefined) {
    diagnostics.push({
      code: "entry-scope-has-parent",
      id: entryScope.id,
      message: "The entry scope cannot have a parent scope.",
      severity: "error",
    });
  }
  const rootScopes = Object.values(definition.scopes).filter(
    ({ parentScopeId }) => parentScopeId === undefined,
  );
  if (
    rootScopes.length !== 1 ||
    rootScopes[0]?.id !== definition.entryScopeId
  ) {
    diagnostics.push({
      code: "invalid-root-scope-count",
      id: definition.entryScopeId,
      message:
        "The entry scope must be the workflow's unique parentless scope.",
      severity: "error",
    });
  }
  for (const scope of Object.values(definition.scopes)) {
    if ((scope.id === definition.entryScopeId) !== (scope.kind === "root")) {
      diagnostics.push({
        code: "invalid-root-scope-kind",
        id: scope.id,
        message: "Only the entry scope may have kind root.",
        severity: "error",
      });
    }
    if (scope.id !== definition.entryScopeId) {
      const owners = scopeOwners.get(scope.id) ?? [];
      if (owners.length !== 1) {
        diagnostics.push({
          code: "invalid-scope-owner-count",
          id: scope.id,
          message: `Scope ${scope.label} must have exactly one owning scope node; found ${owners.length}.`,
          severity: "error",
        });
      }
    }
    const invalidInitialCount =
      scope.kind === "parallel"
        ? scope.initialNodeIds.length < 1
        : scope.initialNodeIds.length !== 1;
    if (invalidInitialCount) {
      diagnostics.push({
        code: "invalid-scope-initials",
        id: scope.id,
        message:
          scope.kind === "parallel"
            ? `Parallel scope ${scope.label} needs at least one initial region.`
            : `${scope.kind} scope ${scope.label} needs exactly one initial node.`,
        severity: "error",
      });
    }
    for (const nodeId of [
      ...scope.initialNodeIds,
      ...scope.entryActivities,
      ...scope.exitActivities,
    ]) {
      const node = Object.values(definition.nodes).find(
        ({ id }) => id === nodeId,
      );
      if (!node || node.scopeId !== scope.id) {
        diagnostics.push({
          code: "invalid-scope-member",
          id: scope.id,
          message: `Scope ${scope.label} refers to missing or foreign node ${nodeId}.`,
          severity: "error",
        });
      } else if (
        (scope.entryActivities.includes(nodeId) ||
          scope.exitActivities.includes(nodeId)) &&
        node.kind !== "activity"
      ) {
        diagnostics.push({
          code: "invalid-scope-lifecycle-activity",
          id: scope.id,
          message: `Scope ${scope.label} lifecycle node ${nodeId} must be an activity.`,
          severity: "error",
        });
      }
    }
    if (scope.parentScopeId && !(scope.parentScopeId in definition.scopes)) {
      diagnostics.push({
        code: "missing-parent-scope",
        id: scope.id,
        message: `Scope ${scope.label} refers to missing parent ${scope.parentScopeId}.`,
        severity: "error",
      });
    }
  }

  const reportedScopeCycles = new Set<string>();
  for (const scope of Object.values(definition.scopes)) {
    const path: string[] = [];
    const pathIndexes = new Map<string, number>();
    let current: string | undefined = scope.id;
    while (current !== undefined && current in definition.scopes) {
      const cycleStart = pathIndexes.get(current);
      if (cycleStart !== undefined) {
        const cycle = path.slice(cycleStart).sort();
        const cycleId = cycle.join(",");
        if (!reportedScopeCycles.has(cycleId)) {
          reportedScopeCycles.add(cycleId);
          diagnostics.push({
            code: "scope-parent-cycle",
            id: cycleId,
            message: `Scope parent relationships contain a cycle: ${cycle.join(" → ")}.`,
            severity: "error",
          });
        }
        break;
      }
      pathIndexes.set(current, path.length);
      path.push(current);
      current = definition.scopes[current].parentScopeId;
    }
  }

  for (const node of Object.values(definition.nodes)) {
    if (node.kind !== "scope") {
      continue;
    }
    const child = Object.values(definition.scopes).find(
      ({ id }) => id === node.childScopeId,
    );
    if (!child || child.parentScopeId !== node.scopeId) {
      diagnostics.push({
        code: "invalid-scope-node",
        id: node.id,
        message: `Scope node ${node.label} must own a child scope whose parent is ${node.scopeId}.`,
        severity: "error",
      });
    }
  }

  for (const group of Object.values(definition.routeGroups)) {
    if (!group) {
      continue;
    }
    const members = Object.values(definition.transitions).filter(
      ({ routeGroupId }) => routeGroupId === group.id,
    );
    const sources = new Set(members.map(({ sourceNodeId }) => sourceNodeId));
    const triggers = new Set(members.map(({ trigger }) => trigger));
    if (sources.size > 1 || triggers.size > 1) {
      diagnostics.push({
        code: "incoherent-route-group",
        id: group.id,
        message: `Route group ${group.id} must contain one source and one trigger disposition.`,
        severity: "error",
      });
    }
    if (group.mode === "firstMatch") {
      const priorities = members.map(({ priority }) => priority);
      if (new Set(priorities).size !== priorities.length) {
        diagnostics.push({
          code: "duplicate-route-priority",
          id: group.id,
          message: `First-match route group ${group.id} must use unique priorities.`,
          severity: "error",
        });
      }
    }
  }

  for (const transition of Object.values(definition.transitions)) {
    const loop = transition.loop as
      | { durableYield?: unknown; maxIterations?: unknown }
      | undefined;
    diagnostics.push(...triggerDiagnostics(transition.trigger, transition.id));
    if (!nodeIds.has(transition.sourceNodeId)) {
      diagnostics.push({
        code: "missing-transition-source",
        id: transition.id,
        message: `Transition ${transition.id} has no source node ${transition.sourceNodeId}.`,
        severity: "error",
      });
    }
    if (!nodeIds.has(transition.targetNodeId)) {
      diagnostics.push({
        code: "missing-transition-target",
        id: transition.id,
        message: `Transition ${transition.id} has no target node ${transition.targetNodeId}.`,
        severity: "error",
      });
    }
    if (!(transition.routeGroupId in definition.routeGroups)) {
      diagnostics.push({
        code: "missing-route-group",
        id: transition.id,
        message: `Transition ${transition.id} refers to missing route group ${transition.routeGroupId}.`,
        severity: "error",
      });
    }
    if (transition.guard) {
      diagnostics.push(
        ...conditionDiagnostics(transition.guard, transition.id),
      );
    }
    if (
      transition.sourcePort !== undefined &&
      transition.sourcePort.trim() === ""
    ) {
      diagnostics.push({
        code: "empty-source-port",
        id: transition.id,
        message: `Transition ${transition.id} cannot use an empty source port.`,
        severity: "error",
      });
    }
    if (
      transition.targetPort !== undefined &&
      transition.targetPort.trim() === ""
    ) {
      diagnostics.push({
        code: "empty-target-port",
        id: transition.id,
        message: `Transition ${transition.id} cannot use an empty target port.`,
        severity: "error",
      });
    }
    if (!Number.isSafeInteger(transition.priority)) {
      diagnostics.push({
        code: "invalid-transition-priority",
        id: transition.id,
        message: `Transition ${transition.id} priority must be a safe integer.`,
        severity: "error",
      });
    }
    if (
      loop &&
      Object.hasOwn(loop, "maxIterations") &&
      (typeof loop.maxIterations !== "number" ||
        !Number.isSafeInteger(loop.maxIterations) ||
        loop.maxIterations <= 0)
    ) {
      diagnostics.push({
        code: "invalid-loop-bound",
        id: transition.id,
        message: `Transition ${transition.id} must use a positive safe-integer iteration bound.`,
        severity: "error",
      });
    }
    if (
      loop &&
      Object.hasOwn(loop, "durableYield") &&
      loop.durableYield !== true
    ) {
      diagnostics.push({
        code: "invalid-durable-yield",
        id: transition.id,
        message: `Transition ${transition.id} durableYield must be true.`,
        severity: "error",
      });
    }
  }

  const transitions = Object.values(definition.transitions);
  // A cycle is safe only when every possible traversal crosses a progress
  // boundary. Removing bounded/durable-yield transitions and durable wait
  // vertices must therefore leave a DAG. Checking only whether an SCC contains
  // one bound is insufficient: a smaller cycle inside it may bypass that edge.
  const hotNodeIds = [...nodeIds].filter(
    (nodeId) => definition.nodes[nodeId].kind !== "wait",
  );
  const hotNodes = new Set(hotNodeIds);
  const hotTransitions = transitions.filter(
    ({ loop, sourceNodeId, targetNodeId }) =>
      loop === undefined &&
      hotNodes.has(sourceNodeId) &&
      hotNodes.has(targetNodeId),
  );
  for (const component of stronglyConnectedComponents(
    hotNodeIds,
    hotTransitions,
  )) {
    const members = new Set(component);
    const internal = hotTransitions.filter(
      ({ sourceNodeId, targetNodeId }) =>
        members.has(sourceNodeId) && members.has(targetNodeId),
    );
    const cyclic =
      component.length > 1 ||
      internal.some(
        ({ sourceNodeId, targetNodeId }) => sourceNodeId === targetNodeId,
      );
    if (!cyclic) {
      continue;
    }
    diagnostics.push({
      code: "cycle-without-progress",
      id: component.slice().sort().join(","),
      message:
        "Every cycle must cross a bounded transition, durable-yield transition, or wait node.",
      severity: "error",
    });
  }

  return diagnostics;
}

export function assertPublishable(definition: WorkflowDefinitionV2): void {
  const errors = validateWorkflow(definition).filter(
    ({ severity }) => severity === "error",
  );
  if (errors.length !== 0) {
    throw new Error(errors.map(({ message }) => message).join("\n"));
  }
}
