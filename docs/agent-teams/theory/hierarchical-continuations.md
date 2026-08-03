# Hierarchical continuations, observations, and durable composition

This note extends the [token and routing semantics](operational-semantics.md) with crash recovery, external observations, and nested Agent Teams. Its purpose is explanatory and falsifiable: it states which equivalences the implementation relies on and where nondeterminism remains.

## Definitions

A **root run** is the user-authorized execution represented by one public run record. An **execution** is either the root control kernel or one nested workflow invocation. An **execution path** is the ordered list of effect keys from the root to an execution. A **qualified wait** pairs an execution path with a local wait. A **checkpoint tree** is the root continuation plus every active child continuation. A **linearization point** is the single event at which a concurrent operation is considered to have taken effect.

| Symbol                           | Definition                                                |
| -------------------------------- | --------------------------------------------------------- |
| $`r`$                            | root run identity                                         |
| $`x`$                            | execution identity; `root` or a parent effect key         |
| $`K_x`$                          | deterministic kernel state of execution $`x`$             |
| $`D_x`$                          | immutable, pinned workflow definition of execution $`x`$  |
| $`O`$                            | finite map from effect/guard keys to durable observations |
| $`T`$                            | finite rooted tree of active continuation states          |
| $`\nu`$                          | public root revision                                      |
| $`P = [x_1,\ldots,x_m]`$         | path from the root to one nested execution                |
| $`w`$                            | a local wait identity                                     |
| $`P \mathbin{\triangleright} w`$ | qualified wait at path $`P`$                              |
| $`E_D`$                          | ordered public events in the encrypted continuation       |
| $`E_L`$                          | ordered coordination/checkpoint events in RSpace          |
| $`J`$                            | canonical inspector journal                               |

The durable root configuration is:

```math
\mathcal{C} = \langle r, \nu, T, O, L \rangle,
```

where $`L`$ is the public metadata projection. Private values occur in $`T`$ and $`O`$, while $`L`$ contains only identities, hashes, status, qualified wait IDs, grants, deadlines, and event types.

## Product semantics for nested teams

A workflow activity at execution $`x`$ creates child $`y`$ with identity equal to the parent effect key. The child definition and input are pinned by the request. Composition is not textual inlining: parent $`K_x`$ remains blocked on one effect while child $`K_y`$ reduces independently.

For an ordinary child control step:

```math
\frac{\langle K_y,D_y,O\rangle \longrightarrow
      \langle K'_y,D_y,O'\rangle}
     {\langle K_x[K_y],D_x,D_y,O\rangle \longrightarrow
      \langle K_x[K'_y],D_x,D_y,O'\rangle}.
```

The notation $`K_x[K_y]`$ means that the parent continuation owns the child under its pending workflow effect. The parent token does not advance during this rule.

When the child completes with value $`v`$ and disposition $`d`$, it becomes a durable observation of the parent effect:

```math
\frac{K_y \Downarrow \langle v,d\rangle}
     {K_x[K_y] \longrightarrow
      \operatorname{observe}(K_x,\langle v,d\rangle)}.
```

The child continuation can then be removed because the observation is encrypted and content-addressed. A replay reconstructing the same parent effect key finds $`O[y]`$ and need not execute the child again.

## Qualified suspension

If child $`y`$ suspends at local wait $`w`$, the parent exposes $`[y] \mathbin{\triangleright} w`$. If a grandchild $`z`$ suspends, the root exposes $`[y,z] \mathbin{\triangleright} w`$. The concrete encoding is prefix-free because execution keys contain no colon separators and every segment is introduced by `nested:`.

Command routing is structural recursion:

```text
APPLY-QUALIFIED-COMMAND(continuation, path, localWait, command):
  # An empty path identifies a wait owned by this exact execution.
  if path is empty:
    REQUIRE localWait in continuation.pendingWaits
    APPLY-LOCAL-COMMAND(continuation, localWait, command)
    return

  # One path segment names one active child; no search or fuzzy match occurs.
  childId, rest <- HEAD(path), TAIL(path)
  child <- REQUIRE continuation.nestedWorkflows[childId]
  APPLY-QUALIFIED-COMMAND(child, rest, localWait, command)
```

This yields **wait-address uniqueness**: if local wait IDs are unique within each continuation and child IDs are unique among siblings, then qualified wait IDs are unique in the checkpoint tree. The proof is by induction on path length. Empty paths reduce to local uniqueness. For nonempty paths, unequal first child IDs distinguish the addresses; equal first IDs reduce to the induction hypothesis in the same child.

## Effect identity and replay

For node $`n`$, correlation epoch $`e`$, attempt $`a`$, and execution $`x`$, the effect key is a cryptographic hash of the domain-separated tuple:

```math
k = H(r \mathbin{\|} 0 \mathbin{\|} x \mathbin{\|} 0
      \mathbin{\|} n \mathbin{\|} 0 \mathbin{\|} e
      \mathbin{\|} 0 \mathbin{\|} a).
```

The zero-byte separator prevents ambiguous concatenation. Including $`x`$ makes identical node IDs in sibling teams independent. Guard keys use the same execution-domain principle.

Let `dispatch(k)` mean submitting the signed outbox request and `observe(k)` mean reading or writing its observation. Recovery implements:

```text
EXECUTE-IDEMPOTENT(k, request):
  # Observation is the durable completion certificate.
  if observation[k] exists:
    return observation[k]

  # Outbox creation is exclusive; concurrent/retried writers converge on bytes.
  outbox <- GET-OR-CREATE-SIGNED-OUTBOX(k, request)
  deploy <- DISPATCH(outbox)
  result <- AWAIT-AND-NORMALIZE(deploy)
  return GET-OR-CREATE-SIGNED-OBSERVATION(k, result)
```

This is **exactly-once-visible**, not necessarily exactly-once physical execution. If an external system does not deduplicate operation $`k`$, a crash between physical effect and observation publication can repeat that physical effect. Capability-aware providers should therefore accept $`k`$ as their idempotency key. The public run revision still advances at most once because RSpace uses a compare-and-set.

## Crash equivalence

Consider a checkpoint interval containing deterministic steps and external effects. Deterministic steps can be replayed from the prior checkpoint. An external step can be replayed from its durable observation. Therefore, assuming observation integrity and idempotent provider handling, recovery is observationally equivalent to uninterrupted execution at the workflow boundary:

```math
\operatorname{trace}(\operatorname{recover}(\mathcal{C},O))
\equiv
\operatorname{trace}(\operatorname{continue}(\mathcal{C},O)),
```

where $`\equiv`$ ignores the number and timing of outbox submissions but preserves control observations, revisions, dispositions, and terminal output.

The assumption is explicit. An unsigned or mutable observation store would invalidate the equivalence; so would silently rebinding a child to a latest definition. This is why the implementation authenticates encrypted artifacts, pins definition hashes, and rejects identity mismatch.

## Linearizability of the run register

All mutations consume one private map token and restore one token. In a successful deploy, no two mutations can occupy the critical section simultaneously. Each operation therefore has a linearization point between receipt and replacement of the token. Revision compare-and-set imposes a total order on successful advancements for one run.

The system does not infer visibility from finality alone. Let $`F(d)`$ mean deploy $`d`$ is finalized and $`V(s)`$ mean the read node exposes state $`s`$. The implementation requires:

```math
F(d) \land \Diamond V(s_{\mathrm{expected}})
```

before continuing, rather than assuming $`F(d) \Rightarrow V(s_{\mathrm{expected}})`$ at the first read. The temporal diamond denotes eventual observation within the configured bounded polling window. If the window expires, Embers reports a failure and does not execute dependent effects.

## Canonical journal composition

Write $`A \preceq B`$ when sequence $`A`$ is a subsequence of $`B`$. The inspector constructs journal $`J`$ so both authenticated storage orders survive:

```math
E_D \preceq J
\qquad\text{and}\qquad
\operatorname{normalize}(E_L) \preceq J.
```

Normalization maps the legacy ledger name `runStarted` to durable `runCreated`; it does not discard events. Protocol checkpoint events occur in both sequences, while public command rejection can occur between checkpoints and therefore only in $`E_L`$. Repeated names require deliberate alignment: scanning backward chooses the rightmost compatible ledger occurrence for each durable anchor. A successful claim consequently aligns after any earlier claim/rejection pair.

```text
MERGE-JOURNALS(durable, ledger):
  # Work backward so a repeated durable event anchors to the latest compatible
  # ledger occurrence, leaving earlier rejected attempts in their true prefix.
  anchors <- RIGHTMOST-COMPATIBLE-ANCHORS(durable, NORMALIZE(ledger))

  # Between anchors, durable kernel events precede later coordination-only
  # ledger events; both source sequences remain subsequences of the result.
  result <- []
  for anchor in anchors from left to right:
    APPEND durable events before anchor
    APPEND ledger events before anchor
    APPEND anchor exactly once
  APPEND both remaining suffixes
  return RENUMBER-CONTIGUOUSLY(result)
```

The protocol invariant that checkpoint event types appear in both orders makes these anchors unambiguous after rightmost alignment. Hash, capability, or identity failure stops composition; an unauthenticated sequence cannot satisfy the premise.

## Safety and liveness claims

The implemented hierarchy maintains:

1. **Definition pinning:** every active execution names one manifest whose canonical hash equals its workflow reference.
2. **Execution isolation:** effect and guard identities are domain-separated by execution ID.
3. **Qualified authority:** a delegate grant for one qualified approval wait authorizes no sibling or ancestor wait.
4. **Checkpoint closure:** a root checkpoint contains every active child continuation reachable through pending workflow effects.
5. **Revision monotonicity:** committed root revisions increase by exactly one.
6. **Bounded nesting:** at most 32 active workflow-call frames occur along one path.
7. **Audit order:** the canonical journal contains both the durable kernel sequence and the public ledger sequence as subsequences.

Liveness depends on validator finality, F1r3drive publication, activity completion or timeout, and required human decisions. These are environmental fairness assumptions, not consequences of the deterministic kernel.

## Relation to established models

The parent-blocks/child-reduces rule resembles hierarchical state machines, while the token marking and joins retain workflow-net intuition. See David Harel, “Statecharts: A Visual Formalism for Complex Systems,” [doi:10.1016/0167-6423(87)90035-9](<https://doi.org/10.1016/0167-6423(87)90035-9>), and van der Aalst, “The Application of Petri Nets to Workflow Management,” [doi:10.1142/S0218126698000043](https://doi.org/10.1142/S0218126698000043).

The single map-token register is an actor-like serialized state owner expressed in the $`\rho`$-calculus target. The causal revision discipline follows Lamport, [doi:10.1145/359545.359563](https://doi.org/10.1145/359545.359563). Compensation follows the Saga model of semantic counter-actions rather than atomic rollback, [doi:10.1145/38713.38742](https://doi.org/10.1145/38713.38742).
