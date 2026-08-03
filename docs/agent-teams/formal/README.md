# Formal models

The models in this directory are deliberately finite, executable abstractions. They establish design-level invariants; they are not a refinement proof of the Rust kernel, generated Rholang, RSpace, or F1r3drive.

## Cyclic token model

`AgentTeamsWorkflow.tla` models one Workflow v2 token moving from input into a loop, across a bounded feedback edge, and into a wait boundary. It checks:

- every state remains well typed;
- the bounded transition counter never exceeds its declared maximum;
- a hot segment never exceeds the number of nodes in the accepted residual graph;
- `runStarted` is the first ledger event;
- `runReturned` cannot occur without a preceding event.

The specification follows the usual TLA+ shape $`\operatorname{Init} \land \Box[\operatorname{Next}]_{vars}`$.

## Durable hierarchy model

`DurableHierarchy.tla` models the protocol that composes a root continuation, one embedded child continuation, public revision metadata, encrypted artifact publication, an effect outbox, observations, and a revision-fenced resume command. The symbols are:

| Symbol            | Meaning                                                      |
| ----------------- | ------------------------------------------------------------ |
| `artifacts`       | Revisions whose private encrypted checkpoint already exists. |
| `ledgerRevision`  | The public RSpace revision visible to recovery workers.      |
| `stagedRevision`  | A private checkpoint awaiting public publication.            |
| `waitPath`        | The qualified child/wait route used by a resume command.     |
| `outbox`          | Whether a durable effect request exists.                     |
| `observedEffects` | Number of signed observations durably accepted.              |
| `appliedEffects`  | Number of observations incorporated into control state.      |
| `claimedRevision` | The ledger revision against which a command was claimed.     |

The model checks that:

- the ledger never points to an absent artifact;
- published revisions strictly increase;
- dispatch requires an outbox;
- applying an effect requires a prior observation;
- a visible suspension always has a durable checkpoint and exactly one qualified wait path;
- a claimed/applied command remains fenced to the ledger revision it claimed;
- `runStarted` remains the first public event.

The crash model is stuttering: a crash changes no durable variable. Recovery may therefore repeat any enabled outbox, observation, checkpoint, or command step without inventing volatile state. This is the same abstraction used when reasoning about write-ahead logs and transactional outboxes.

## Statechart scope model

`StatechartScopes.tla` models the scope lifecycle of the [statechart semantics](../theory/statechart-semantics.md) over one compound scope with two inner nodes and up to two tokens: entry with a sequential entry activity, initial seeding with the implicit history override, position recording with the consumption asymmetry, fan-out, completion by count exhaustion, history capture at the completion instant, a sequential exit activity, and re-entry. One TLC run covers all three history modes — `Init` chooses the scope's declared mode nondeterministically from `none`, `shallow`, and `deep`.

| Symbol      | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| `phase`     | Lifecycle phase: idle, entry, running, exit.                       |
| `alpha`     | The kernel's stored live-token counter (`active_tokens`).          |
| `live`      | Ground truth: the set of live tokens.                              |
| `lastPos`   | Last recorded position per token; persists through consumption.    |
| `hist`      | Captured history for the scope, keyed by the definition scope.     |
| `entries`   | Completed entries, bounding re-entry.                              |
| `seeded`    | Whether the current run seeded from initials or remembered history.|

The model checks that:

- the stored counter always equals the live population (token conservation across seeding, fan-out, and consumption);
- entry activities strictly precede any token, and exit activities run only on a drained scope;
- a running scope is never empty — emptiness is exactly completion;
- history exists only after a completion captured it, carries the declared mode, and is never captured by a `none`-mode scope;
- a history-seeded re-entry starts exactly on the remembered configuration, and an initials-seeded run exactly on the declared initials;
- the entry budget is respected.

Checked result: 231 distinct states, all invariants hold, across all three modes in one run. The model deliberately excludes the history-*node* restore path (only implicit re-entry restore is modeled): the multi-target history-node token-accounting hazard identified during the documentation review is a code-level finding, not a model target, and is listed in the [roadmap](../roadmap.md).

## Run TLC

With the `tlc` launcher installed:

```bash
tlc -config AgentTeamsWorkflow.cfg AgentTeamsWorkflow.tla
tlc -config DurableHierarchy.cfg DurableHierarchy.tla
tlc -config StatechartScopes.cfg StatechartScopes.tla
```

The expected result is that every configured invariant holds. Increase `MaxIterations`, `MaxRevision`, `MaxEffects`, and `MaxEntries` to explore larger finite state spaces.

## Traceability

| Formal action/property | Implementation                                                               |
| ---------------------- | ---------------------------------------------------------------------------- |
| `Step(e)`              | Persistent node/router send in `workflow_rendering.rs`.                      |
| `counters`             | Per-token `iterations` map in `runtime.rs` and the direct compiler.          |
| `Exhaust(e)`           | `iterationLimit` disposition emitted by a bounded transition.                |
| `hotSteps`             | Residual-graph Tarjan check in TypeScript and Rust.                          |
| `WriteCheckpoint`      | Encrypted, exclusive-create artifact publication in `continuation_store.rs`. |
| `PublishCheckpoint`    | Signed `advanceRun` and exact post-finality acknowledgement.                 |
| `WriteOutbox`          | Encrypted `EffectOutbox` stored before activity dispatch.                    |
| `ObserveEffect`        | Signed, content-addressed `ActivityObservation`.                             |
| `ClaimResume`          | Signed `claimCommand` compare-and-set against expected revision.             |
| `QualifiedWait`        | Recursive `nested:<execution-id>:<wait-id>` routing.                         |
| `EnterScope`           | `enter_scope` in `runtime.rs:965-995`.                                       |
| `RunEntryActivity` / `RunExitActivity` | `advance_scope_lifecycle` in `runtime.rs:601-633`.           |
| `StartTokens`          | `start_scope_initials` in `runtime.rs:635-667` (history overrides initials). |
| `MoveToken`            | `record_active_node` in `runtime.rs:1028-1052`.                              |
| `FanOut`               | `adjust_scope_fanout` in `runtime.rs:1386-1395`.                             |
| `ConsumeToken`         | `consume_scope_token` in `runtime.rs:1054-1086` (snapshot at count zero).    |
| `FinishScope`          | `finish_scope_instance` in `runtime.rs:669-686`.                             |

## Scope and limitations

All three models abstract portable values, guards, consensus internals, encryption primitives, and social posting. A future definition-to-model compiler should generate a finite transition system from a concrete published definition and model:

1. a multiset of tokens — now partially covered: `StatechartScopes.tla` models a two-token multiset with conservation inside one scope; cross-scope markings remain future work;
2. first-match exclusivity and all-match completeness;
3. join occupancy by correlation epoch;
4. multiple wait/resume commands and idempotent effect providers;
5. cancellation and compensation;
6. version-pinned migration.

Scope entry ordering, completion propagation, exit ordering, and history capture/restore — previously on this list in spirit — are now covered by `StatechartScopes.tla`.

For the mathematical proof behind `HotSegmentSafety`, see the [progress-boundary theorem](../theory/operational-semantics.md#progress-boundary-theorem). For qualified child waits and crash equivalence, see [hierarchical continuation theory](../theory/hierarchical-continuations.md).

TLA+ describes behaviors as state sequences and makes concurrent step order explicit; see Leslie Lamport, _Specifying Systems_ (2002), available from the [author’s official TLA+ page](https://lamport.org/tla/book.html), and Yu, Lamport, Matthews, and Tuttle, “Specifying and Verifying Systems with TLA+,” [doi:10.1145/1133373.1133382](https://doi.org/10.1145/1133373.1133382) ([author’s copy](https://lamport.org/pubs/spec-and-verifying.pdf)). The outbox stages follow the reliable-messaging pattern discussed by Garcia-Molina and Salem’s Saga model, [doi:10.1145/38713.38742](https://doi.org/10.1145/38713.38742), while preserving the distinction between compensation and rollback.
