import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";

import type {
  ActivityReference,
  JoinPolicy,
  NodeExecutionPolicy,
  WorkflowDefinitionV2,
  WorkflowNode,
  WorkflowScope,
} from "./types";

import { activityReferenceFromJson } from "./activity";
import { conditionFromJson } from "./condition";

const DEFAULT_ROOT_SCOPE_ID = "scope:root";

function nodeLabel(node: Node): string {
  const labelled = node.data as Record<string, unknown>;
  const label = labelled.agentName ?? labelled.label ?? labelled.containerId;
  return typeof label === "string" && label.trim() !== "" ? label : node.type;
}

function activity(node: Node): ActivityReference {
  const data = node.data as Record<string, unknown>;
  switch (node.type) {
    case "agent": {
      const agentId = typeof data.agentId === "string" ? data.agentId : "";
      const agentVersion =
        typeof data.agentVersion === "string" ? data.agentVersion : "";
      return {
        agentId,
        agentVersion,
        kind: "agent",
        protocol:
          data.protocol === "structured-v1" ? "structured-v1" : "simple-v1",
      };
    }
    case "compress":
    case "text-model":
    case "tti-model":
    case "tts-model":
      return { kind: "builtin", name: node.type };
    case "rholang-activity":
      return {
        kind: "rholang",
        protocol: data.protocol === "simple-v1" ? "simple-v1" : "structured-v1",
        uri: typeof data.uri === "string" ? data.uri : "",
      };
    case "workflow-activity":
      return {
        kind: "workflow",
        teamId: typeof data.teamId === "string" ? data.teamId : "",
        version: typeof data.version === "string" ? data.version : "",
      };
    case "foreign-term":
      return {
        abi: {
          entrypoint:
            typeof data.entrypoint === "string" ? data.entrypoint : "main",
          inputBinding:
            typeof data.inputBinding === "string" ? data.inputBinding : "input",
          outputBinding:
            typeof data.outputBinding === "string"
              ? data.outputBinding
              : "output",
          version: "flt-v1",
        },
        artifactHash:
          typeof data.artifactHash === "string" ? data.artifactHash : "",
        authorities: csv(data.activityAuthorities ?? data.authorities),
        kind: "foreign-term",
        languageSpecificationHash:
          typeof data.languageSpecificationHash === "string"
            ? data.languageSpecificationHash
            : "",
        languageTag:
          typeof data.languageTag === "string" ? data.languageTag : "",
        resources: {
          fuel: positiveInteger(data.fuel, 10_000),
          maxOutputBytes: positiveInteger(data.maxOutputBytes, 65_536),
          maxPhlo: positiveInteger(data.maxPhlo, 5_000_000),
        },
        source: typeof data.source === "string" ? data.source : "",
      };
    case "approval":
    case "deploy-container":
    case "fan-in-map":
    case "final-node":
    case "gateway":
    case "history":
    case "input-node":
    case "output-node":
    case "wait":
      throw new Error(`node ${node.id} (${node.type}) is not an activity`);
  }
}

function csv(value: unknown): string[] {
  return typeof value === "string"
    ? [
        ...new Set(
          value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ]
    : [];
}

function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : fallback;
}

function executionPolicy(node: Node): NodeExecutionPolicy | undefined {
  const data = node.data as Record<string, unknown>;
  const maxAttempts = positiveInteger(data.maxAttempts, 1);
  const timeout = positiveInteger(data.timeoutMillis, 0);
  const maxOutputBytes = positiveInteger(data.policyMaxOutputBytes, 0);
  const authorities = csv(data.policyAuthorities);
  const retryOn = csv(data.retryOn);
  if (
    maxAttempts === 1 &&
    timeout === 0 &&
    maxOutputBytes === 0 &&
    authorities.length === 0
  ) {
    return undefined;
  }
  return {
    authorities,
    compensation:
      typeof data.compensationJson === "string" &&
      data.compensationJson.trim() !== "" &&
      data.compensationJson.trim() !== "null"
        ? activityReferenceFromJson(data.compensationJson)
        : typeof data.compensationUri === "string" &&
            data.compensationUri.trim()
          ? {
              kind: "rholang",
              protocol: "structured-v1",
              uri: data.compensationUri.trim(),
            }
          : undefined,
    maxOutputBytes: maxOutputBytes || undefined,
    retry:
      maxAttempts > 1
        ? {
            backoffMultiplierMillis: positiveInteger(
              data.backoffMultiplierMillis,
              2_000,
            ),
            deterministicJitter: data.deterministicJitter !== "false",
            initialDelayMillis: positiveInteger(data.initialDelayMillis, 1_000),
            maxAttempts,
            maxDelayMillis: positiveInteger(data.maxDelayMillis, 60_000),
            retryOn,
          }
        : undefined,
    timeout: timeout > 0 ? { afterMillis: timeout } : undefined,
  };
}

function workflowNode(
  node: Node,
  incomingCount: number,
  scopeId: string,
  childScopeId?: string,
): WorkflowNode | undefined {
  const base = {
    id: node.id,
    label: nodeLabel(node),
    policy: executionPolicy(node),
    scopeId,
  };
  const join = joinPolicy(node, incomingCount);

  switch (node.type) {
    case "input-node":
      return { ...base, kind: "input" };
    case "output-node":
      return { ...base, join, kind: "output" };
    case "final-node":
      return { ...base, join, kind: "final" };
    case "history":
      return {
        ...base,
        history:
          (node.data as { history?: "deep" | "shallow" }).history === "deep"
            ? "deep"
            : "shallow",
        join,
        kind: "history",
      };
    case "deploy-container":
      return {
        ...base,
        childScopeId: childScopeId ?? node.id,
        join,
        kind: "scope",
      };
    case "fan-in-map":
      return { ...base, join, kind: "transform", transform: "fan-in-map" };
    case "gateway":
      return { ...base, join, kind: "gateway" };
    case "wait":
      return {
        ...base,
        join,
        kind: "wait",
        signal: (node.data as { signal?: string }).signal?.trim() || undefined,
        timer:
          (node.data as { waitFor?: string }).waitFor === "timer"
            ? {
                delayMillis: positiveInteger(
                  (node.data as { delayMillis?: number }).delayMillis,
                  60_000,
                ),
              }
            : undefined,
        waitFor:
          (node.data as { waitFor?: "event" | "signal" | "timer" }).waitFor ??
          "signal",
      };
    case "approval":
      return {
        ...base,
        approvers: csv(node.data.approvers),
        join,
        kind: "approval",
        policyId:
          (node.data as { policyId?: string }).policyId ??
          `approval:${node.id}`,
        quorum: positiveInteger(node.data.quorum, 1),
      };
    case "agent":
    case "compress":
    case "text-model":
    case "tti-model":
    case "tts-model":
    case "rholang-activity":
    case "workflow-activity":
    case "foreign-term":
      return { ...base, activity: activity(node), join, kind: "activity" };
  }
}

function joinPolicy(node: Node, incomingCount: number): JoinPolicy | undefined {
  const data = node.data as Record<string, unknown>;
  if (incomingCount <= 1 && typeof data.joinMode !== "string") {
    return undefined;
  }
  const correlation: JoinPolicy["correlation"] =
    data.correlationMode === "routeGroup" &&
    typeof data.correlationValue === "string"
      ? { kind: "routeGroup", routeGroupId: data.correlationValue }
      : data.correlationMode === "key" &&
          typeof data.correlationValue === "string"
        ? (() => {
            const [root, ...path] = data.correlationValue.split(".");
            return {
              kind: "key" as const,
              value: {
                kind: "path" as const,
                path,
                root:
                  root === "input" ||
                  root === "output" ||
                  root === "error" ||
                  root === "state"
                    ? root
                    : "state",
              },
            };
          })()
        : { kind: "root" };
  switch (data.joinMode) {
    case "each":
      return { correlation, mode: "each" };
    case "quorum":
      return {
        correlation,
        late:
          data.late === "cancel" || data.late === "error"
            ? data.late
            : "discard",
        mode: "quorum",
        quorum: typeof data.quorum === "number" ? data.quorum : incomingCount,
      };
    case "race":
      return {
        correlation,
        late:
          data.late === "cancel" || data.late === "error"
            ? data.late
            : "discard",
        mode: "race",
      };
    case "reduce": {
      const operations = new Set([
        "collect",
        "first",
        "last",
        "max",
        "mergeRecords",
        "min",
        "sum",
      ]);
      const operation =
        typeof data.reduceOperation === "string" &&
        operations.has(data.reduceOperation)
          ? (data.reduceOperation as Extract<
              JoinPolicy,
              { mode: "reduce" }
            >["reducer"]["operation"])
          : "collect";
      let until: Extract<JoinPolicy, { mode: "reduce" }>["until"] = {
        kind: "literal",
        value: true,
      };
      if (typeof data.reduceUntil === "string") {
        until = conditionFromJson(data.reduceUntil);
      }
      return { correlation, mode: "reduce", reducer: { operation }, until };
    }
    default:
      return { correlation, mode: "all" };
  }
}

export function toWorkflowDefinition(
  nodes: Node[],
  edges: Edge[],
  baseDefinition?: WorkflowDefinitionV2,
): WorkflowDefinitionV2 {
  const rootScopeId = baseDefinition?.entryScopeId ?? DEFAULT_ROOT_SCOPE_ID;
  const realNodeIds = new Set(nodes.map(({ id }) => id));
  const connectedEdges = edges.filter(
    ({ source, target }) => realNodeIds.has(source) && realNodeIds.has(target),
  );
  const incoming = new Map<string, number>();
  for (const { target } of connectedEdges) {
    incoming.set(target, (incoming.get(target) ?? 0) + 1);
  }

  const scopeByContainer = new Map(
    nodes
      .filter((node) => node.type === "deploy-container")
      .map((node) => {
        const configured = (node.data as { childScopeId?: unknown })
          .childScopeId;
        return [
          node.id,
          typeof configured === "string" && configured.trim() !== ""
            ? configured
            : node.id,
        ] as const;
      }),
  );
  if (
    scopeByContainer.size !==
    nodes.filter((node) => node.type === "deploy-container").length
  ) {
    throw new Error(
      "Every state-scope container must own a distinct child scope.",
    );
  }
  const ownerScope = (node: Node) =>
    node.parentId === undefined
      ? rootScopeId
      : (scopeByContainer.get(node.parentId) ?? node.parentId);

  const workflowNodes = Object.fromEntries(
    nodes
      .map((node) =>
        workflowNode(
          node,
          incoming.get(node.id) ?? 0,
          ownerScope(node),
          scopeByContainer.get(node.id),
        ),
      )
      .filter((node): node is WorkflowNode => node !== undefined)
      .map((node) => [node.id, node]),
  );

  const scopes: WorkflowDefinitionV2["scopes"] = {
    [rootScopeId]: {
      entryActivities:
        baseDefinition?.scopes[rootScopeId]?.entryActivities ?? [],
      exitActivities: baseDefinition?.scopes[rootScopeId]?.exitActivities ?? [],
      history: baseDefinition?.scopes[rootScopeId]?.history ?? "none",
      id: rootScopeId,
      initialNodeIds:
        baseDefinition?.scopes[rootScopeId]?.initialNodeIds ??
        Object.values(workflowNodes)
          .filter(
            ({ kind, scopeId }) => kind === "input" && scopeId === rootScopeId,
          )
          .map(({ id }) => id),
      kind: "root",
      label: baseDefinition?.scopes[rootScopeId]?.label ?? "Agent Team",
    },
  };

  for (const container of nodes.filter(
    (node) => node.type === "deploy-container",
  )) {
    const childScopeId = scopeByContainer.get(container.id) ?? container.id;
    if (childScopeId === rootScopeId || Object.hasOwn(scopes, childScopeId)) {
      throw new Error(
        `State-scope id ${childScopeId} must be unique and cannot own the root scope.`,
      );
    }
    const containerData = container.data as Record<string, unknown>;
    const hasConfiguredInitials = Object.hasOwn(
      containerData,
      "initialNodeIds",
    );
    scopes[childScopeId] = {
      entryActivities: csv(
        (container.data as Record<string, unknown>).entryActivities,
      ),
      exitActivities: csv(
        (container.data as Record<string, unknown>).exitActivities,
      ),
      history:
        (container.data as { history?: "deep" | "none" | "shallow" }).history ??
        "none",
      id: childScopeId,
      initialNodeIds: hasConfiguredInitials
        ? csv(containerData.initialNodeIds)
        : Object.values(workflowNodes)
            .filter(
              ({ kind, scopeId }) =>
                kind === "input" && scopeId === childScopeId,
            )
            .map(({ id }) => id),
      kind:
        (container.data as { scopeKind?: "compound" | "parallel" }).scopeKind ??
        "compound",
      label: nodeLabel(container),
      parentScopeId:
        container.parentId === undefined
          ? rootScopeId
          : (scopeByContainer.get(container.parentId) ?? container.parentId),
    };
  }

  const routeGroups: WorkflowDefinitionV2["routeGroups"] = {};
  const transitions: WorkflowDefinitionV2["transitions"] = {};
  const presentationEdges: WorkflowDefinitionV2["presentation"]["edges"] = {};

  for (const edge of connectedEdges) {
    const data = edge.data ?? {};
    const transitionId = data.transitionId ?? edge.id;
    if (Object.hasOwn(transitions, transitionId)) {
      throw new Error(`Transition id ${transitionId} must be unique.`);
    }
    const routeGroupId =
      data.routeGroupId ??
      `route:${edge.source}:${data.trigger ?? "completed"}`;
    const routeGroup = {
      id: routeGroupId,
      mode: data.routeMode ?? "allMatches",
      noMatch: data.noMatch ?? "fail",
    };
    const existingRouteGroup = routeGroups[routeGroupId];
    if (
      existingRouteGroup &&
      (existingRouteGroup.mode !== routeGroup.mode ||
        existingRouteGroup.noMatch !== routeGroup.noMatch)
    ) {
      throw new Error(
        `Route group ${routeGroupId} has conflicting routing or no-match policies.`,
      );
    }
    routeGroups[routeGroupId] = routeGroup;
    transitions[transitionId] = {
      guard: data.guard,
      id: transitionId,
      loop: data.loop,
      priority: data.priority ?? 0,
      routeGroupId,
      sourceNodeId: edge.source,
      sourcePort: edge.sourceHandle ?? undefined,
      targetNodeId: edge.target,
      targetPort: edge.targetHandle ?? undefined,
      trigger: data.trigger ?? "completed",
    };
    // A label-less edge is the default state now; serializing {label:
    // undefined} would be indistinguishable in JSON but noisy for every
    // in-memory consumer, so the entry stays present and empty instead.
    presentationEdges[transitionId] =
      typeof edge.label === "string" ? { label: edge.label } : {};
  }

  return {
    entryScopeId: rootScopeId,
    interface: baseDefinition?.interface ?? {
      inputs: { input: { kind: "string" } },
      outputs: { output: { kind: "legacy" } },
    },
    nodes: workflowNodes,
    policies: baseDefinition?.policies ?? {
      defaultExecution: "auto",
      visibility: "private",
    },
    presentation: {
      edges: presentationEdges,
      nodes: Object.fromEntries(
        nodes.map((node) => [
          node.id,
          {
            height: node.measured?.height ?? node.height,
            width: node.measured?.width ?? node.width,
            x: node.position.x,
            y: node.position.y,
          },
        ]),
      ),
    },
    routeGroups,
    schemaVersion: "2.0",
    scopes,
    transitions,
    types: baseDefinition?.types ?? {},
  };
}

function reactFlowType(node: WorkflowNode): Node["type"] {
  switch (node.kind) {
    case "input":
      return "input-node";
    case "output":
      return "output-node";
    case "final":
      return "final-node";
    case "gateway":
      return "gateway";
    case "approval":
      return "approval";
    case "wait":
      return "wait";
    case "transform":
      return "fan-in-map";
    case "activity":
      if (node.activity.kind === "agent") {
        return "agent";
      }
      if (node.activity.kind === "builtin") {
        return node.activity.name;
      }
      if (node.activity.kind === "rholang") {
        return "rholang-activity";
      }
      if (node.activity.kind === "workflow") {
        return "workflow-activity";
      }
      return "foreign-term";
    case "history":
      return "history";
    case "scope":
      return "deploy-container";
  }
}

function reactFlowData(node: WorkflowNode): Record<string, string | number> {
  const policyData: Record<string, string | number> = node.policy
    ? {
        backoffMultiplierMillis:
          node.policy.retry?.backoffMultiplierMillis ?? 2_000,
        compensationJson: JSON.stringify(node.policy.compensation ?? null),
        deterministicJitter: String(
          node.policy.retry?.deterministicJitter ?? true,
        ),
        initialDelayMillis: node.policy.retry?.initialDelayMillis ?? 1_000,
        maxAttempts: node.policy.retry?.maxAttempts ?? 1,
        maxDelayMillis: node.policy.retry?.maxDelayMillis ?? 60_000,
        policyAuthorities: node.policy.authorities.join(", "),
        policyMaxOutputBytes: node.policy.maxOutputBytes ?? 0,
        retryOn: node.policy.retry?.retryOn.join(", ") ?? "",
        timeoutMillis: node.policy.timeout?.afterMillis ?? 0,
      }
    : { label: node.label };
  policyData.label = node.label;
  const joinData: Record<string, string | number> = node.join
    ? {
        ...policyData,
        correlationMode: node.join.correlation.kind,
        correlationValue:
          node.join.correlation.kind === "routeGroup"
            ? node.join.correlation.routeGroupId
            : node.join.correlation.kind === "key" &&
                node.join.correlation.value.kind === "path"
              ? [
                  node.join.correlation.value.root,
                  ...node.join.correlation.value.path,
                ].join(".")
              : "",
        joinMode: node.join.mode,
        late:
          node.join.mode === "quorum" || node.join.mode === "race"
            ? node.join.late
            : "discard",
        quorum: node.join.mode === "quorum" ? node.join.quorum : 1,
        reduceOperation:
          node.join.mode === "reduce" ? node.join.reducer.operation : "collect",
        reduceUntil:
          node.join.mode === "reduce" ? JSON.stringify(node.join.until) : "",
      }
    : policyData;
  switch (node.kind) {
    case "activity":
      if (node.activity.kind === "agent") {
        return {
          ...joinData,
          agentId: node.activity.agentId,
          agentName: node.label,
          agentVersion: node.activity.agentVersion,
          protocol: node.activity.protocol,
        };
      }
      if (node.activity.kind === "rholang") {
        return {
          ...joinData,
          protocol: node.activity.protocol,
          uri: node.activity.uri,
        };
      }
      if (node.activity.kind === "workflow") {
        return {
          ...joinData,
          teamId: node.activity.teamId,
          version: node.activity.version,
        };
      }
      if (node.activity.kind === "foreign-term") {
        return {
          ...joinData,
          activityAuthorities: node.activity.authorities.join(", "),
          artifactHash: node.activity.artifactHash,
          entrypoint: node.activity.abi.entrypoint,
          fuel: node.activity.resources.fuel,
          inputBinding: node.activity.abi.inputBinding,
          languageSpecificationHash: node.activity.languageSpecificationHash,
          languageTag: node.activity.languageTag,
          maxOutputBytes: node.activity.resources.maxOutputBytes,
          maxPhlo: node.activity.resources.maxPhlo,
          outputBinding: node.activity.abi.outputBinding,
          source: node.activity.source,
        };
      }
      return joinData;
    case "approval":
      return {
        ...joinData,
        approvers: node.approvers.join(", "),
        policyId: node.policyId,
        quorum: node.quorum,
      };
    case "wait":
      return {
        ...joinData,
        delayMillis: node.timer?.delayMillis ?? 60_000,
        signal: node.signal ?? "",
        waitFor: node.waitFor,
      };
    case "final":
    case "gateway":
    case "input":
    case "output":
    case "scope":
    case "transform":
      return joinData;
    case "history":
      return { ...joinData, history: node.history };
  }
}

/** Lossless semantic-document to canvas projection. */
export function fromWorkflowDefinition(
  definition: WorkflowDefinitionV2,
): [Node[], Edge[]] {
  const scopes: Partial<Record<string, WorkflowScope>> = definition.scopes;
  const scopeNodes = Object.values(definition.nodes).filter(
    (node): node is Extract<WorkflowNode, { kind: "scope" }> =>
      node.kind === "scope",
  );
  const ownerByScope = new Map<string, string>();
  for (const scopeNode of scopeNodes) {
    if (ownerByScope.has(scopeNode.childScopeId)) {
      throw new Error(
        `Scope ${scopeNode.childScopeId} has more than one owning scope node.`,
      );
    }
    if (scopeNode.childScopeId === definition.entryScopeId) {
      throw new Error(`Scope node ${scopeNode.id} cannot own the root scope.`);
    }
    ownerByScope.set(scopeNode.childScopeId, scopeNode.id);
  }
  const depths = new Map<string, number>([[definition.entryScopeId, 0]]);
  const scopeDepth = (
    scopeId: string,
    visiting = new Set<string>(),
  ): number => {
    const known = depths.get(scopeId);
    if (known !== undefined) {
      return known;
    }
    if (visiting.has(scopeId)) {
      throw new Error(`Scope parent cycle contains ${scopeId}.`);
    }
    const scope = scopes[scopeId];
    if (!scope) {
      throw new Error(`Scope ${scopeId} does not exist.`);
    }
    if (!scope.parentScopeId) {
      throw new Error(`Non-root scope ${scopeId} has no parent scope.`);
    }
    const nextVisiting = new Set(visiting);
    nextVisiting.add(scopeId);
    const depth = scopeDepth(scope.parentScopeId, nextVisiting) + 1;
    depths.set(scopeId, depth);
    return depth;
  };
  const containers = [...scopeNodes]
    .sort(
      (left, right) =>
        scopeDepth(left.childScopeId) - scopeDepth(right.childScopeId),
    )
    .map((scopeNode): Node => {
      const scope = scopes[scopeNode.childScopeId];
      if (!scope) {
        throw new Error(
          `Scope node ${scopeNode.id} refers to missing scope ${scopeNode.childScopeId}.`,
        );
      }
      const presentation = definition.presentation.nodes[scopeNode.id];
      const parentId =
        scope.parentScopeId === undefined ||
        scope.parentScopeId === definition.entryScopeId
          ? undefined
          : ownerByScope.get(scope.parentScopeId);
      if (
        scope.parentScopeId !== undefined &&
        scope.parentScopeId !== definition.entryScopeId &&
        parentId === undefined
      ) {
        throw new Error(
          `Scope ${scope.id} has no scope node for parent ${scope.parentScopeId}.`,
        );
      }
      return {
        data: {
          ...reactFlowData(scopeNode),
          childScopeId: scope.id,
          containerId: scope.label,
          entryActivities: scope.entryActivities.join(", "),
          exitActivities: scope.exitActivities.join(", "),
          history: scope.history,
          initialNodeIds: scope.initialNodeIds.join(", "),
          scopeKind: scope.kind === "parallel" ? "parallel" : "compound",
        },
        extent: parentId === undefined ? undefined : "parent",
        height: presentation?.height,
        id: scopeNode.id,
        parentId,
        position: {
          x: presentation?.x ?? 0,
          y: presentation?.y ?? 0,
        },
        style: {
          height: presentation?.height,
          width: presentation?.width,
        },
        type: "deploy-container",
        width: presentation?.width,
      } as Node;
    });

  const nodes = Object.values(definition.nodes)
    .filter((node) => node.kind !== "scope")
    .map((node): Node => {
      const presentation = definition.presentation.nodes[node.id];
      const isRoot = node.scopeId === definition.entryScopeId;
      const parentId = isRoot ? undefined : ownerByScope.get(node.scopeId);
      if (!isRoot && parentId === undefined) {
        throw new Error(
          `Node ${node.id} belongs to scope ${node.scopeId}, which has no scope node.`,
        );
      }
      return {
        data: reactFlowData(node),
        extent: isRoot ? undefined : "parent",
        height: presentation?.height,
        id: node.id,
        parentId,
        position: {
          x: presentation?.x ?? 0,
          y: presentation?.y ?? 0,
        },
        type: reactFlowType(node),
        width: presentation?.width,
      } as Node;
    });

  const edges = Object.values(definition.transitions).map(
    (transition): Edge => {
      const routeGroup = definition.routeGroups[transition.routeGroupId];
      if (!routeGroup) {
        throw new Error(
          `Transition ${transition.id} refers to missing route group ${transition.routeGroupId}.`,
        );
      }
      return {
        data: {
          guard: transition.guard,
          loop: transition.loop,
          noMatch: routeGroup.noMatch,
          priority: transition.priority,
          routeGroupId: transition.routeGroupId,
          routeMode: routeGroup.mode,
          transitionId: transition.id,
          trigger: transition.trigger,
        },
        id: transition.id,
        label: definition.presentation.edges[transition.id]?.label,
        source: transition.sourceNodeId,
        sourceHandle: transition.sourcePort,
        target: transition.targetNodeId,
        targetHandle: transition.targetPort,
      };
    },
  );

  return [[...containers, ...nodes], edges];
}
