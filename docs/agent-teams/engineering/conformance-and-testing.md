# Conformance and verification

This document defines how an Agent Teams Workflow v2 implementation demonstrates that its editor, portable definition, validators, durable kernel, Rholang boundary, storage, and public interaction agree. It records reproducible evidence rather than treating a successful build as proof of end-to-end behavior.

![Agent Teams system context](../diagrams/01-system-context.svg)

## Terms

A **conformance surface** is one independently checkable boundary of the system, such as the TypeScript validator or the Rust runtime. **Parity** means that two surfaces accept and reject the same portable construct under the same rule. A **live test** crosses real process boundaries and uses the running Rust F1r3node, F1r3drive mount, Embers API, and, where applicable, F1r3sky services. A **finalized deploy** is a deploy included in a finalized block without an on-chain error. **Observer visibility** is the separate fact that a read node returns the exact state produced by that deploy.

TLA+ model checking supplies finite-state design evidence. It does not prove a refinement from Rust, generated Rholang, RSpace, or F1r3drive. The implementation, integration, and live-system gates below close those additional boundaries.

## Conformance surfaces

| Surface               | Primary evidence                                          | Property established                                                                                                                      |
| --------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Portable syntax       | TypeScript types, Rust Serde types, generated OpenAPI SDK | Field names, tagged variants, bounds, and additive compatibility agree.                                                                   |
| Publish validation    | TypeScript and Rust validator tests                       | References, route groups, joins, guards, scopes, pins, and hot-cycle rules have parity.                                                   |
| Editor projection     | React Flow round-trip tests                               | Supported semantic fields survive definition-to-canvas-to-definition projection.                                                          |
| Deterministic kernel  | Rust nextest suite                                        | Branches, cycles, epochs, joins, scopes, history, waits, commands, retry, timeout, compensation, and hierarchy execute deterministically. |
| Rholang boundary      | Renderer/template tests and live deploys                  | Persistent contracts, source pins, signatures, registry operations, and run-ledger mutations parse and execute on Rust F1r3node.          |
| Durable artifacts     | F1r3drive unit, recovery, and live tests                  | Private artifacts are encrypted, content-addressed, capability-bound, flushed before publication, and recoverable.                        |
| Public ledger/journal | Exact post-finality and inspector assertions              | The observer returns the complete ledger postcondition; verified F1r3drive hydration preserves approval, rejection, and checkpoint order. |
| Social adapter        | F1r3sky integration tests                                 | A mention invokes the pinned team and a terminal reply retains its run link within 280 Unicode scalar values.                             |
| Formal abstraction    | TLC exhaustive finite-state search over three models (cyclic token, durable hierarchy, statechart scopes) | Configured safety and progress-boundary invariants hold in every reachable abstract state, including scope entry/exit ordering, token conservation, and history capture/restore soundness across all three history modes. |
| Documentation Rholang excerpts | `rholang-parser` validation harness (read-only, pinned `nightly-2025-09-14`) | Every snippet embedded in the [Rholang realization](../design/rholang-realization.md) parses as valid Rholang: 19 snippets, 19 passes, zero failures.                              |
| Known-gap visibility  | deliberate absence, recorded here                         | No test exercises durable-yield resumption (creation only) or approval-deadline firing; both are tracked [known gaps](../roadmap.md#known-gaps), not silent omissions.            |

## Finality and read visibility protocol

Finality is necessary but not sufficient for a successful API response. A validator event may arrive before the observer serves the corresponding state. The implementation therefore follows this literate protocol:

```text
SUBMIT-AND-CONFIRM(mutation, expectedPostcondition):
  # A mutation is submitted exactly once; retrying an ambiguous write could duplicate an effect.
  deployId <- SUBMIT-ONCE(mutation)

  # Consensus finality establishes that the deploy cannot be displaced.
  REQUIRE-FINALIZED-WITHOUT-ERROR(deployId, configuredFinalizationBudget)

  # Read-node visibility is a second condition; stale but well-formed values are not success.
  state <- POLL-OBSERVER-UNTIL(expectedPostcondition)
  return state
```

`EMBERS__FINALIZATION__DEPLOY_TIMEOUT_MILLIS` configures the implicit finalized-deploy budget and must be positive. The local stack sets it to 120,000 milliseconds. A workflow activity with an explicit timeout keeps that smaller semantic deadline. The synchronous integration client uses 180 seconds so HTTP transport and post-finality reads retain headroom beyond the server budget.

The gRPC write client gives each request a hard 30-second RPC deadline. It retries the read-only head-block lookup at most three times with a 250-millisecond base delay and preserves attempt context in the final error. Deploy submissions are never retried. Application-level HTTP/2 PING is disabled because it caused healthy long-lived local connections to be closed under sustained load; TCP keepalive remains enabled.

## Reproducible verification

### Rust workspace

The workspace depends on `gxhash`, which requires AES and SSE2 target features. Run every Rust test through nextest:

```bash
cd ../embers
RUSTFLAGS="-C target-cpu=native" cargo nextest run --workspace
RUSTFLAGS="-C target-cpu=native" cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo fmt --all -- --check
```

### Python live integration

Start the persistent local profile first. `up` is non-destructive; only `reset` removes state.

```bash
cd ../embers-local-stack
./stack.sh up
./stack.sh status

cd ../embers/packages/embers
uv run ruff check .
uv run ruff format --check .
uv run pytest -q
```

The status output must identify both nodes as `F1r3node Rust`, report F1r3drive as `mounted (managed)`, report Embers as `up (managed, durable)`, and report the F1r3sky web UI as `up (managed)`. A green HTTP-only test against an in-memory substitute is not equivalent evidence.

### Durable storage client

F1r3drive targets Java 17. Its unit gate covers encrypted reads and the deployment-dispatcher durability boundary; the shaded JAR is the artifact managed by the local stack.

```bash
cd ../f1r3drive
JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./gradlew spotlessCheck test shadowJar --rerun-tasks
```

### F1r3sky interaction client

The social client has a focused pending-run store test plus its normal lint and type gates. Disable customer-demo dotenv loading when reproducing the upstream non-self-hosted embed suite; otherwise that suite correctly sees third-party embeds as disabled.

```bash
cd ../f1r3sky
yarn test src/state/agent-runs.test.ts
yarn eslint src/state/agent-runs.ts src/state/agent-runs.test.ts src/state/queries/agent-teams.ts src/state/queries/usePostThread/index.ts
yarn typecheck
EXPO_PUBLIC_SELF_HOSTED=false \
EXPO_PUBLIC_DEFAULT_SERVICE=https://bsky.social \
EXPO_PUBLIC_PUBLIC_APPVIEW=https://public.api.bsky.app \
EXPO_PUBLIC_PUBLIC_APPVIEW_DID=did:web:api.bsky.app \
yarn test --no-cache
```

### Frontend, SDK, and editor

```bash
cd embers-frontend
pnpm --filter @f1r3fly-io/embers-frontend test --runInBand
pnpm --filter @f1r3fly-io/embers-client-sdk test --runInBand
pnpm --filter @f1r3fly-io/oslf-editor test --runInBand

pnpm --filter @f1r3fly-io/embers-frontend ci:lint
pnpm --filter @f1r3fly-io/embers-frontend ci:check:code
pnpm --filter @f1r3fly-io/embers-frontend ci:check:css
pnpm --filter @f1r3fly-io/embers-frontend typecheck
pnpm --filter @f1r3fly-io/embers-frontend build
```

The SDK and editor also expose `ci:lint`, `ci:check:code`, and `typecheck`; release automation should execute those package-local gates as well.

### Formal models

```bash
cd docs/agent-teams/formal
tlc -config AgentTeamsWorkflow.cfg AgentTeamsWorkflow.tla
tlc -config DurableHierarchy.cfg DurableHierarchy.tla
```

Both searches must end with “No error has been found,” zero states left on the queue, and a complete state-graph depth. See the [formal-model traceability table](../formal/README.md#traceability) for the abstraction-to-code mapping.

## Verified baseline

The complete baseline below was reproduced on 2026-08-02 against the same long-lived local profile rather than a freshly reset chain.

| Gate                                            |                                               Result |
| ----------------------------------------------- | ---------------------------------------------------: |
| Rust workspace nextest                          |                                           343 passed |
| Rust strict Clippy                              | all targets and features passed with warnings denied |
| Python live integration                         |                        64 passed in 1,117.23 seconds |
| F1r3drive unit tests and shaded JAR             |                     105 passed; production JAR built |
| F1r3sky Jest                                    |                          22 suites, 441 tests passed |
| Embers frontend Jest                            |                          17 suites, 160 tests passed |
| Client SDK Jest                                 |                            9 suites, 39 tests passed |
| OSLF editor Jest                                |                             1 suite, 18 tests passed |
| Frontend lint, formatting, style, and typecheck |                                           all passed |
| Production frontend build                       |                                               passed |
| Cyclic token TLC model                          |         12 generated, 8 distinct, 0 queued, no error |
| Durable hierarchy TLC model                     |      465 generated, 261 distinct, 0 queued, no error |

The live profile used Rust F1r3node `0.4.15` at revision `c95595a`, two peered nodes, a systemd-managed F1r3drive mount, systemd-managed durable Embers, and a profile-scoped systemd-managed F1r3sky web UI. The already-funded browser-importable service wallet reported a balance of `50000000000000000`. The six Testnet/wallet tests that had previously exposed sustained-load transport and finalization defects also passed independently before the full suite.

## Failure interpretation

| Failure                                            | Interpretation                              | Required response                                                                         |
| -------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Frontend accepts what Rust rejects                 | Validator parity defect                     | Reconcile the rule and add the same fixture on both surfaces.                             |
| Deploy finalizes but the expected record is absent | Observer visibility or postcondition defect | Continue bounded exact-state polling; never report a different record as success.         |
| Read-only head lookup loses transport              | Transient transport failure                 | Apply the bounded read-only retry policy and preserve operation/attempt context.          |
| Deploy submission loses transport                  | Ambiguous mutation outcome                  | Do not resubmit automatically; reconcile by deploy identity or return an explicit error.  |
| TLC reports an invariant violation                 | Design counterexample                       | Preserve the trace, correct the model and implementation, then rerun every affected gate. |
| F1r3drive is absent or not mounted                 | Durability boundary unavailable             | Refuse durable Embers startup; do not fall back to ordinary local storage.                |
| Inspector artifact hash or identity differs        | Audit-integrity failure                     | Fail the read; never replace the canonical journal with an unverified ledger-only view.   |

## Scope boundary

Foreign Language Term nodes are represented as draft data but are rejected at publication until the Rholang 1.4/MeTTaIL specification and the required FIPS stabilize. That rejection is the specified behavior and has parity tests; it does not claim a runtime capability that the protected language specification cannot yet define. No f1r3node or MeTTaIL source change is part of Workflow v2.

The theoretical basis for the checked invariants is developed in [operational semantics](../theory/operational-semantics.md) and [hierarchical continuation theory](../theory/hierarchical-continuations.md). The finite-model method follows Lamport's TLA+ approach; see _Specifying Systems_ on the [author's official TLA+ page](https://lamport.org/tla/book.html).
