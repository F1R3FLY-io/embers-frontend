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

## Run TLC

With the `tlc` launcher installed:

```bash
tlc -config AgentTeamsWorkflow.cfg AgentTeamsWorkflow.tla
tlc -config DurableHierarchy.cfg DurableHierarchy.tla
```

The expected result is that every configured invariant holds. Increase `MaxIterations`, `MaxRevision`, and `MaxEffects` to explore larger finite state spaces.

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

## Scope and limitations

Both models abstract portable values, guards, consensus internals, encryption primitives, and social posting. A future definition-to-model compiler should generate a finite transition system from a concrete published definition and model:

1. a multiset of tokens;
2. first-match exclusivity and all-match completeness;
3. join occupancy by correlation epoch;
4. multiple wait/resume commands and idempotent effect providers;
5. cancellation and compensation;
6. version-pinned migration.

For the mathematical proof behind `HotSegmentSafety`, see the [progress-boundary theorem](../theory/operational-semantics.md#progress-boundary-theorem). For qualified child waits and crash equivalence, see [hierarchical continuation theory](../theory/hierarchical-continuations.md).

TLA+ describes behaviors as state sequences and makes concurrent step order explicit; see Leslie Lamport, _Specifying Systems_ (2002), available from the [author’s official TLA+ page](https://lamport.org/tla/book.html), and Yu, Lamport, Matthews, and Tuttle, “Specifying and Verifying Systems with TLA+,” [official paper](https://lamport.org/pubs/spec-and-verifying.pdf). The outbox stages follow the reliable-messaging pattern discussed by Garcia-Molina and Salem’s Saga model, [doi:10.1145/38713.38742](https://doi.org/10.1145/38713.38742), while preserving the distinction between compensation and rollback.
