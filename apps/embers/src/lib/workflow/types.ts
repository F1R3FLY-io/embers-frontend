export type Id = string;

export type PortableType =
  | { kind: "artifact" }
  | { kind: "bool" }
  | { kind: "bytes" }
  | { kind: "capability" }
  | { kind: "duration" }
  | { kind: "error" }
  | { kind: "int" }
  | { kind: "legacy" }
  | { kind: "list"; value: PortableType }
  | { fields: Record<string, PortableType>; kind: "record" }
  | { kind: "string" }
  | { kind: "timestamp" }
  | { kind: "unit" }
  | { kind: "variant"; variants: Record<string, PortableType> };

export type ValuePath = {
  path: string[];
  root: "error" | "input" | "output" | "state";
};

export type Condition =
  | { kind: "all"; operands: Condition[] }
  | { kind: "any"; operands: Condition[] }
  | {
      kind: "compare";
      left: ValueExpression;
      operator: "eq" | "ge" | "gt" | "le" | "lt" | "ne";
      right: ValueExpression;
    }
  | { expression: ValueExpression; kind: "exists" }
  | { kind: "literal"; value: boolean }
  | { kind: "not"; operand: Condition }
  | {
      inputs: Record<string, ValuePath>;
      kind: "rholang";
      source: string;
      sourceHash?: string;
    };

export type ValueExpression =
  | { kind: "literal"; value: boolean | number | string | null }
  | ({ kind: "path" } & ValuePath);

export type ExecutionDisposition =
  | "cancelled"
  | "completed"
  | "compensated"
  | "failed"
  | "iterationLimit"
  | "rejected"
  | "resourceExhausted"
  | "skipped"
  | "timedOut";

export type RoutingMode = "allMatches" | "firstMatch";

export type JoinPolicy =
  | { correlation: CorrelationPolicy; mode: "all" }
  | { correlation: CorrelationPolicy; mode: "each" }
  | {
      correlation: CorrelationPolicy;
      late: "cancel" | "discard" | "error";
      mode: "quorum";
      quorum: number;
    }
  | {
      correlation: CorrelationPolicy;
      late: "cancel" | "discard" | "error";
      mode: "race";
    }
  | {
      correlation: CorrelationPolicy;
      mode: "reduce";
      reducer: {
        operation:
          | "collect"
          | "first"
          | "last"
          | "max"
          | "mergeRecords"
          | "min"
          | "sum";
      };
      until: Condition;
    };

export type CorrelationPolicy =
  | { kind: "key"; value: ValueExpression }
  | { kind: "root" }
  | { kind: "routeGroup"; routeGroupId: Id };

export type ActivityReference =
  | {
      agentId: string;
      agentVersion: string;
      kind: "agent";
      protocol: "simple-v1" | "structured-v1";
    }
  | {
      kind: "builtin";
      name: "compress" | "text-model" | "tti-model" | "tts-model";
    }
  | {
      abi: {
        entrypoint: string;
        inputBinding: string;
        outputBinding: string;
        version: "flt-v1";
      };
      artifactHash: string;
      authorities: string[];
      kind: "foreign-term";
      languageSpecificationHash: string;
      languageTag: string;
      resources: {
        fuel: number;
        maxOutputBytes: number;
        maxPhlo: number;
      };
      source: string;
    }
  | { kind: "rholang"; protocol: "simple-v1" | "structured-v1"; uri: string }
  | { kind: "workflow"; teamId: string; version: string };

export type WorkflowNode = {
  id: Id;
  join?: JoinPolicy;
  label: string;
  outputKey?: string;
  policy?: NodeExecutionPolicy;
  scopeId: Id;
} & (
  | { approvers: string[]; kind: "approval"; policyId: Id; quorum: number }
  | { activity: ActivityReference; kind: "activity" }
  | { kind: "final" }
  | { kind: "gateway" }
  | { kind: "input" }
  | { history: "deep" | "shallow"; kind: "history" }
  | { kind: "output" }
  | { childScopeId: Id; kind: "scope" }
  | { kind: "transform"; transform: "fan-in-map" }
  | {
      kind: "wait";
      signal?: string;
      timer?: { deadline?: ValueExpression; delayMillis?: number };
      waitFor: "event" | "signal" | "timer";
    }
);

export type RetryPolicy = {
  backoffMultiplierMillis: number;
  deterministicJitter: boolean;
  initialDelayMillis: number;
  maxAttempts: number;
  maxDelayMillis: number;
  retryOn: string[];
};

export type NodeExecutionPolicy = {
  authorities: string[];
  compensation?: ActivityReference;
  maxOutputBytes?: number;
  retry?: RetryPolicy;
  timeout?: { afterMillis: number };
};

export type WorkflowTransition = {
  guard?: Condition;
  id: Id;
  loop?: { maxIterations: number } | { durableYield: true };
  priority: number;
  routeGroupId: Id;
  sourceNodeId: Id;
  sourcePort?: string;
  targetNodeId: Id;
  targetPort?: string;
  trigger: ExecutionDisposition | `custom:${string}`;
};

export type RouteGroup = {
  id: Id;
  mode: RoutingMode;
  noMatch: "complete" | "fail" | "skip";
};

export type WorkflowScope = {
  entryActivities: Id[];
  exitActivities: Id[];
  history: "deep" | "none" | "shallow";
  id: Id;
  initialNodeIds: Id[];
  kind: "compound" | "parallel" | "root";
  label: string;
  parentScopeId?: Id;
};

export type WorkflowPresentation = {
  edges: Partial<Record<Id, { label?: string }>>;
  nodes: Partial<
    Record<Id, { height?: number; width?: number; x: number; y: number }>
  >;
};

export type WorkflowDefinitionV2 = {
  deploymentContainers?: Record<
    string,
    {
      id: string;
      label: string;
      nodeIds: string[];
      parentId?: string;
      target: "current";
    }
  >;
  entryScopeId: Id;
  interface: {
    inputs: Record<string, PortableType>;
    outputs: Record<string, PortableType>;
  };
  nodes: Record<Id, WorkflowNode>;
  policies: {
    defaultExecution: "auto" | "bounded" | "durable";
    visibility: "private";
  };
  presentation: WorkflowPresentation;
  routeGroups: Partial<Record<Id, RouteGroup>>;
  schemaVersion: "2.0";
  scopes: Record<Id, WorkflowScope>;
  transitions: Record<Id, WorkflowTransition>;
  types: Record<string, PortableType>;
};

export type WorkflowEdgeData = Record<string, unknown> & {
  guard?: Condition;
  loop?: WorkflowTransition["loop"];
  noMatch?: RouteGroup["noMatch"];
  priority?: number;
  routeGroupId?: string;
  routeMode?: RoutingMode;
  transitionId?: string;
  trigger?: WorkflowTransition["trigger"];
};
