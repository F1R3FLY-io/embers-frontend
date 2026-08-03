# Workflow Definition v2 specification

This document is the portable data contract shared by the Embers TypeScript editor and Rust backend. Normative words such as **must**, **must not**, and **may** describe publish-time behavior. The current schema version is exactly `2.0`.

## Document shape

```ts
type WorkflowDefinitionV2 = {
  schemaVersion: "2.0";
  entryScopeId: string;
  interface: WorkflowInterface;
  nodes: Record<string, WorkflowNode>;
  policies: WorkflowPolicies;
  presentation: WorkflowPresentation;
  routeGroups: Record<string, RouteGroup>;
  scopes: Record<string, WorkflowScope>;
  transitions: Record<string, WorkflowTransition>;
  types: Record<string, PortableType>;
};
```

Each keyed object is an identity map: its key must equal the embedded object’s `id`. IDs are opaque strings. Semantic references use IDs; presentation labels may change without changing identity.

## Minimal executable definition

```json
{
  "schemaVersion": "2.0",
  "entryScopeId": "root",
  "interface": {
    "inputs": { "input": { "kind": "string" } },
    "outputs": { "output": { "kind": "legacy" } }
  },
  "nodes": {
    "input": {
      "id": "input",
      "kind": "input",
      "label": "Input",
      "scopeId": "root"
    },
    "answer": {
      "id": "answer",
      "kind": "activity",
      "label": "Answer",
      "scopeId": "root",
      "activity": {
        "kind": "agent",
        "agentId": "answer-agent",
        "agentVersion": "1",
        "protocol": "simple-v1"
      }
    },
    "output": {
      "id": "output",
      "kind": "output",
      "label": "Output",
      "scopeId": "root"
    }
  },
  "policies": {
    "defaultExecution": "bounded",
    "visibility": "private"
  },
  "presentation": { "edges": {}, "nodes": {} },
  "routeGroups": {
    "input-completed": {
      "id": "input-completed",
      "mode": "allMatches",
      "noMatch": "fail"
    },
    "answer-completed": {
      "id": "answer-completed",
      "mode": "allMatches",
      "noMatch": "fail"
    }
  },
  "scopes": {
    "root": {
      "id": "root",
      "label": "Root",
      "kind": "root",
      "initialNodeIds": ["input"],
      "entryActivities": [],
      "exitActivities": [],
      "history": "none"
    }
  },
  "transitions": {
    "input-answer": {
      "id": "input-answer",
      "sourceNodeId": "input",
      "targetNodeId": "answer",
      "trigger": "completed",
      "priority": 0,
      "routeGroupId": "input-completed"
    },
    "answer-output": {
      "id": "answer-output",
      "sourceNodeId": "answer",
      "targetNodeId": "output",
      "trigger": "completed",
      "priority": 0,
      "routeGroupId": "answer-completed"
    }
  },
  "types": {}
}
```

## Portable value algebra

Workflow values are intentionally language-neutral so a future JavaScript, Python, MeTTa, or other FLT agent can share the same boundary.

| `kind`       | Mathematical intuition      | JSON representation                              |
| ------------ | --------------------------- | ------------------------------------------------ |
| `unit`       | singleton                   | `null`                                           |
| `bool`       | truth value                 | boolean                                          |
| `int`        | integral scalar             | JSON number within the agreed portable range     |
| `string`     | text                        | string                                           |
| `bytes`      | octet sequence              | transport-defined encoded string                 |
| `timestamp`  | instant                     | normalized string                                |
| `duration`   | elapsed time                | normalized string                                |
| `artifact`   | immutable content reference | adapter-defined record                           |
| `capability` | authority-bearing reference | opaque value; never inspect as text              |
| `error`      | structured failure          | portable record                                  |
| `legacy`     | compatibility escape hatch  | any legacy JSON-compatible term                  |
| `list`       | homogeneous sequence        | `{ "kind": "list", "value": T }`                 |
| `record`     | labeled product             | `{ "kind": "record", "fields": { "x": T } }`     |
| `variant`    | labeled sum                 | `{ "kind": "variant", "variants": { "ok": T } }` |

For type interpretation $`\llbracket T \rrbracket`$, the important constructors are:

```math
\begin{aligned}
\llbracket \operatorname{List}(T) \rrbracket &= \llbracket T \rrbracket^{*}, \\
\llbracket \operatorname{Record}(f_i:T_i) \rrbracket &= \prod_i \llbracket T_i \rrbracket, \\
\llbracket \operatorname{Variant}(v_i:T_i) \rrbracket &= \coprod_i \llbracket T_i \rrbracket.
\end{aligned}
```

## Nodes

Every node has `id`, `label`, and `scopeId`; `join` is optional.

| `kind`            | Additional fields                         | Meaning                                                          | Executable status |
| ----------------- | ----------------------------------------- | ---------------------------------------------------------------- | ----------------- |
| `input`           | none                                      | Introduces invocation input.                                     | yes               |
| `output`, `final` | none                                      | Returns the current value.                                       | yes               |
| `gateway`         | none                                      | Routes without transforming.                                     | yes               |
| `transform`       | `transform: "fan-in-map"`                 | Explicit portable transform.                                     | yes               |
| `activity`        | `activity`                                | Invokes an agent, builtin, Rholang URI, pinned workflow, or FLT. | all except FLT    |
| `wait`            | `waitFor: "event" \| "signal" \| "timer"` | Creates an encrypted durable suspension.                         | yes               |
| `approval`        | `policyId`, `approvers`, `quorum`         | Suspends until authorized quorum approval or rejection.          | yes               |
| `scope`           | `childScopeId`                            | Enters a compound or parallel child configuration.               | yes               |
| `history`         | `history`                                 | Restores shallow/deep configuration.                             | yes               |

### Activity references

- `agent` requires `agentId`, immutable `agentVersion`, and `protocol`.
- `builtin` names `compress`, `text-model`, `tti-model`, or `tts-model`.
- `rholang` requires a safe registry `uri` and an agent protocol.
- `workflow` requires a deployed `rho:id:` team URI in `teamId` and the child definition hash in `version`. The runtime revalidates the child manifest and embeds its continuation into the parent checkpoint.
- `foreign-term` records `languageSpecification`, `artifactHash`, `entrypoint`, and `abiVersion`; it is reserved for MeTTaIL-backed Rholang 1.4.

## Transitions and route groups

A transition contains source, target, trigger disposition, priority, route-group identity, and optional ports, guard, and loop policy. All transitions in one route group must have the same source and trigger.

```ts
type WorkflowTransition = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort?: string;
  targetPort?: string;
  trigger: string;
  guard?: Condition;
  priority: number;
  routeGroupId: string;
  loop?: { maxIterations: number } | { durableYield: true };
};
```

`firstMatch` evaluates transitions in ascending `(priority, id)` order and emits only the first true route. Priorities must be unique in that group. `allMatches` evaluates every guard and emits every true route. When none is true, `noMatch` either returns the current value (`complete`), consumes it (`skip`), or returns a structured failure (`fail`).

### Conditions

Conditions form a total, side-effect-free expression tree:

- `literal` contains a boolean.
- `all`, `any`, and `not` compose conditions.
- `exists` checks a value expression against `Nil`.
- `compare` uses `eq`, `ne`, `gt`, `ge`, `lt`, or `le` over two expressions.
- `rholang` contains a pure source expression, declared `inputs`, and an optional `sourceHash`. When present, the hash is the exact lowercase SHA-256 digest of the original UTF-8 source bytes.

Value expressions are scalar literals or paths rooted at `input`, `output`, `state`, or `error`. Path components are record keys.

Pure Rholang source is limited to 4096 bytes and must not contain communication, receives, URI literals, binding forms, contracts, bundles, pattern matching, registry names, or output capabilities. Declared input names contain only ASCII letters, digits, and underscore and must be referenced as `$name`.

The nine standard transition dispositions are `cancelled`, `completed`, `compensated`, `failed`, `iterationLimit`, `rejected`, `resourceExhausted`, `skipped`, and `timedOut`. Approval nodes emit `rejected` when an authorized approver rejects their pending wait. A structured activity may additionally emit `custom:<name>`. A custom name starts with an ASCII letter and contains no more than 128 ASCII letters, digits, dots, underscores, or hyphens.

## Joins

```ts
type JoinPolicy =
  | { mode: "all"; correlation: CorrelationPolicy }
  | { mode: "each"; correlation: CorrelationPolicy }
  | {
      mode: "quorum";
      quorum: number;
      late: LateArrival;
      correlation: CorrelationPolicy;
    }
  | { mode: "race"; late: LateArrival; correlation: CorrelationPolicy }
  | {
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
      correlation: CorrelationPolicy;
    };
```

`each` invokes the target once per arrival. `all` waits for every distinct incoming producer. `quorum` waits for the configured positive count, which must not exceed the number of incoming transitions. `race` accepts the first arrival and applies `discard`, `cancel`, or `error` to later arrivals. `reduce` incrementally applies `first`, `last`, `collect`, `sum`, `min`, `max`, or conflict-detecting `mergeRecords`, then releases when `until` becomes true.

Correlation is represented as `root`, `routeGroup`, or a value-expression `key`. Tokens carry an epoch stack. Fan-out contributes fresh fork generations; join occupancy is keyed by the selected correlation plus the active epoch so overlapping loop generations cannot consume one another.

## Scopes and hierarchy

A scope is `root`, `compound`, or `parallel`, with optional parent, initial nodes, entry and exit activities, and `none`, `shallow`, or `deep` history. The entry scope is the unique parentless scope and the only scope with kind `root`. Every non-root scope has exactly one owning scope node. Publish validation requires every initial node to belong to the scope and every listed entry/exit node to be an activity in that scope; it also rejects missing or recursive parentage. The durable kernel executes entry activities, completion propagation, exit activities, and shallow/deep history. Parallel regions retain multiple active tokens; a compound region has one active child configuration.

## Node execution policies

An optional node `policy` declares effect boundaries without changing routing syntax:

```ts
type NodeExecutionPolicy = {
  authorities: string[];
  compensation?: ActivityReference;
  maxOutputBytes?: number;
  retry?: {
    maxAttempts: number;
    initialDelayMillis: number;
    maxDelayMillis: number;
    backoffMultiplierMillis: number;
    deterministicJitter: boolean;
    retryOn: string[];
  };
  timeout?: { afterMillis: number };
};
```

The effect key is stable across crash/recovery for one run, nested execution, node, correlation epoch, and attempt. Retry increments the attempt and schedules a durable retry timer. A successful forward activity with `compensation` pushes a Saga record; cancellation invokes compensations in reverse completion order. Compensation is a new effect, not atomic rollback.

## Durable command syntax

Commands are outside the portable definition because they are authenticated observations about one run revision. Every request contains `expectedRevision` and a `type` from `signal`, `event`, `timerFired`, `approve`, `reject`, `cancel`, `retry`, or `migrate`. Wait-directed commands carry the exact public `waitId`; a child wait is recursively qualified as `nested:<execution-id>:<wait-id>`. Migration additionally pins source/target hashes and supplies only typed `set`/`remove` state-patch operations.

The model follows the hierarchy, concurrency, and communication motivations of Harel’s statecharts, while using explicit workflow tokens for joins and fan-out. See Harel, “Statecharts: A Visual Formalism for Complex Systems,” _Science of Computer Programming_ 8(3), 1987, [doi:10.1016/0167-6423(87)90035-9](<https://doi.org/10.1016/0167-6423(87)90035-9>), and the [W3C SCXML Recommendation](https://www.w3.org/TR/scxml/).

## Validation phases

Draft validation checks schema version and identity-map integrity. Publish validation additionally checks all references, scope ownership, agent pins, activity authorities, timer shape, safe integer bounds, join cardinalities, route-group coherence, disposition and port syntax, guard purity and source hashes, and exact hot-cycle safety.

Canonical persistence recursively sorts JSON object keys after typed deserialization. Unknown fields are rejected by the Rust schema for closed record variants. Graph positions, dimensions, and edge labels live under `presentation`; execution never depends on canvas geometry.

## Agent ABI

`simple-v1` preserves the existing contract:

```rholang
contract main(@input, return) = {
  return!(input)
}
```

`structured-v1` receives an invocation record and returns a record containing at least the desired fields:

```rholang
contract main(@invocation, return) = {
  return!({
    "output": invocation.getOrElse("input", Nil),
    "disposition": "completed"
  })
}
```

The structured protocol lets routing react to `completed`, `failed`, `rejected`, or domain-specific dispositions without forcing exceptions into ordinary output values.
