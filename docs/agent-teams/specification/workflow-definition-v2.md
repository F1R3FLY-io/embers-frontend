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
| `capability` | authority-bearing reference | opaque value; never inspect as text (schema-reserved: the current runtime neither produces nor consumes it — [object-capability model](../security/capability-model.md#recorded-but-unenforced)) |
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

### Wait nodes and timers

A `wait` node's `timer` object carries either `delayMillis` (a non-negative safe integer; the deadline is computed at suspension time) or `deadline` (a portable value expression evaluating to an RFC 3339 timestamp string).

Two rules keep timer waits resumable. First, a **literal** `deadline` **must** parse with the exact timestamp parser the kernel uses (`chrono`'s RFC 3339 parser, which also accepts a space separator and lowercase `t`/`z`); publish validation rejects anything else on both sides (`invalid-timer-deadline-literal` in TypeScript; the matching `ensure!` in `workflow.rs`), with shared parity vectors pinning the accepted forms. Second, a **computed** deadline that fails at runtime — the expression errors, yields a non-string, or does not parse — never parks a wait: the token routes from the wait node with disposition `failed` and the structured value

```json
{ "error": "<reason>", "deadline": "<raw evaluated value or null>" }
```

readable through the `error` value root by a `failed`-triggered route; absent such a route, the run fails by the standard no-group rule. A wait therefore never exists without a resumable deadline.

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

A scope is `root`, `compound`, or `parallel`, with optional parent, initial nodes, entry and exit activities, and `none`, `shallow`, or `deep` history. The entry scope is the unique parentless scope and the only scope with kind `root`. Every non-root scope has exactly one owning scope node. Publish validation requires every initial node to belong to the scope and every listed entry/exit node to be an activity in that scope; it also rejects missing or recursive parentage. The durable kernel executes entry activities, completion propagation, exit activities, and shallow/deep history. A parallel scope may declare several initial nodes and a compound scope exactly one; at runtime both kinds follow one uniform token discipline — parallelism is token multiplicity, and completion is live-token-count exhaustion. The full dynamic semantics — configurations, entry closure, completion propagation, history capture and restoration, and the run-to-completion relation — are normative in the [statechart semantics](../theory/statechart-semantics.md).

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

The `maxOutputBytes`, `retry`, and `timeout` fields are enforced at runtime. The `authorities` field is validated for shape but **not yet enforced** — it is recorded on the effect request and read by no runtime path today; its current status and the proposal that would make it a real confinement control are the [object-capability model](../security/capability-model.md#recorded-but-unenforced) and the [authority-enforcement proposal](../design/authority-enforcement.md).

The effect key is stable across crash/recovery for one run, nested execution, node, correlation epoch, and attempt. Retry increments the attempt and schedules a durable retry timer. A successful forward activity with `compensation` pushes a Saga record; cancellation invokes compensations in reverse completion order. Compensation is a new effect, not atomic rollback.

The retry schedule is fully deterministic. `backoffMultiplierMillis` is a multiplier in thousandths (`1000` means a factor of one; publish validation requires at least `1000`), and the delay before attempt $`a \ge 2`$ with initial delay $`d_0`$, multiplier field $`m`$, and cap $`d_{\max}`$ is:

```math
d_a = \min\!\Bigl(d_{\max},\; \Bigl\lfloor d_0 \cdot \bigl(\tfrac{m}{1000}\bigr)^{a-2} \Bigr\rfloor\Bigr).
```

When `deterministicJitter` is true and $`d_a > 0`$, the delay is **replaced** by a deterministic uniform sample over $`[0, d_a]`$, derived from the effect key $`k`$ so that replay and recovery compute the identical deadline:

```math
\mathrm{delay}(a) = \mathrm{SHA256}\bigl(k \,\Vert\, \texttt{":"} \,\Vert\, a\bigr)[0..8]_{\mathrm{be}} \bmod (d_a + 1).
```

A disposition is retryable when it appears in `retryOn`, or, when `retryOn` is empty, when it is `failed`, `timedOut`, or `resourceExhausted`. The retry wait is named for the upcoming attempt (`retry:{token}:{a+1}`) and resumes in Enter phase — the node re-executes ([statechart semantics](../theory/statechart-semantics.md#retry-and-structured-cancellation)).

## Durable command syntax

Commands are outside the portable definition because they are authenticated observations about one run revision. Every request contains `expectedRevision` and a `type` from `signal`, `event`, `timerFired`, `approve`, `reject`, `cancel`, `retry`, or `migrate`. Wait-directed commands carry the exact public `waitId`; a child wait is recursively qualified as `nested:<execution-id>:<wait-id>`. Migration additionally pins source/target hashes and supplies only typed `set`/`remove` state-patch operations.

An approval with quorum $`q`$ and decision map $`D`$ (actor to decision identifier) resumes with disposition `completed` exactly when

```math
|D| \ge q,
```

subject to: every decision identifier is globally unique within the run, each actor decides at most once, and an empty approver set admits any ledger-authorized actor. A `reject` from an authorized approver resumes the wait immediately with the standard disposition `rejected`, which routes like any other trigger. Every accepted decision emits `approvalRecorded`; the quorum-reaching decision emits `waitSatisfied`, then `approvalRecorded`, then `runResumed` ([statechart semantics](../theory/statechart-semantics.md#waits-approvals-and-dispositions-as-triggers)).

An approval node whose execution policy declares `timeout.afterMillis` acquires a deadline at suspension time; the deadline is recorded on the wait, published as the run ledger's minimum `dueAt`, and **enforced**: at expiry the recovery scheduler fires the wait through the standard `timerFired` path and it resumes with disposition `timedOut`, routing from the approval node like any other trigger. A timeout emits no `approvalRecorded`, and late `approve` or `reject` commands are rejected with "wait ... is not pending". Because a declared deadline always fires, publish validation **requires** every approval node that declares a timeout to have at least one outgoing transition triggered by `timedOut` (`approval-timeout-unrouted` in TypeScript; "approval node ... declares a timeout but no timedOut route" in `workflow.rs`); timeout-free approvals are unaffected. Migration note: approvals whose deadlines expired under a pre-enforcement kernel begin firing `timedOut` on the first recovery poll after upgrade.

The model follows the hierarchy, concurrency, and communication motivations of Harel’s statecharts, while using explicit workflow tokens for joins and fan-out. See Harel, “Statecharts: A Visual Formalism for Complex Systems,” _Science of Computer Programming_ 8(3), 1987, [doi:10.1016/0167-6423(87)90035-9](<https://doi.org/10.1016/0167-6423(87)90035-9>), and the [W3C SCXML Recommendation](https://www.w3.org/TR/scxml/); the construct-by-construct mapping onto SCXML, with the differences analyzed against its interpretation algorithm, is the [SCXML correspondence](../design/scxml-correspondence.md), and the per-construct Rholang lowering is the [Rholang realization](../design/rholang-realization.md).

One scheduling note belongs beside the loop policies: a `durableYield` transition suspends durably and crash-safely with its wait's `dueAt` set to the park instant, which makes it immediately scheduler-fireable — the recovery scheduler resumes it automatically through the same self-signed `timerFired` path as a due timer, one full ledger round-trip per iteration, re-entering the transition's target in Enter phase. No schema field or command class was added for this. Migration note: yields parked by a pre-fix kernel carry no `dueAt` and remain resumable only by run-level `cancel` or `migrate`; yields parked after the fix resume automatically. The full semantics are in the [statechart semantics](../theory/statechart-semantics.md#durable-yield-as-a-scheduling-point).

## Validation phases

Draft validation checks schema version and identity-map integrity. Publish validation additionally checks all references, scope ownership, agent pins, activity authorities, timer shape, safe integer bounds, join cardinalities, route-group coherence, disposition and port syntax, guard purity and source hashes, and exact hot-cycle safety. Three rules are called out because each closes a runtime failure mode with TypeScript/Rust parity: `invalid-timer-deadline-literal` (a literal timer deadline must parse with the kernel's exact parser), `approval-timeout-unrouted` (a declared approval timeout must have a `timedOut` route), and `invalid-lifecycle-route-target` (every transition sourced at a scope's entry or exit lifecycle activity must target an activity node, regardless of trigger — the kernel routes lifecycle failures with their purpose intact, and a non-activity target would be a hard kernel error).

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
