# Operational semantics and theoretical basis

This document gives Agent Teams Workflow v2 a mathematical reading. It is not a claim that arbitrary agents are deterministic. It isolates the deterministic control kernel from nondeterministic activities so that each can be specified honestly.

## Vocabulary and symbols

A **workflow** is a finite directed multigraph augmented with scopes, routing groups, joins, and typed activities. A **token** is one pending unit of control plus its data. A **marking** is the finite multiset of active tokens. A **disposition** is the labeled outcome emitted by a node, such as `completed` or `failed`. A **progress boundary** is a construct that prevents an unbounded sequence of reductions in one hot execution: a wait node, bounded transition, or durable-yield transition.

| Symbol          | Definition                                                 |
| --------------- | ---------------------------------------------------------- |
| $`N`$           | finite set of workflow nodes                               |
| $`E`$           | finite set of directed transitions                         |
| $`S`$           | finite set of hierarchical scopes                          |
| $`R`$           | finite set of route groups                                 |
| $`s(e), t(e)`$  | source and target node of transition $`e`$                 |
| $`\tau(e)`$     | trigger disposition of $`e`$                               |
| $`g_e`$         | total boolean guard of $`e`$                               |
| $`p(e)`$        | integer priority of $`e`$                                  |
| $`M`$           | marking, a finite multiset of tokens                       |
| $`v`$           | current portable value                                     |
| $`c`$           | execution context containing input, state, and counters    |
| $`\kappa_c(e)`$ | current bounded-iteration count for $`e`$ in context $`c`$ |
| $`d`$           | node disposition                                           |

We write a token as $`\langle n, v, c, q \rangle`$, where $`n \in N`$ is its node and $`q`$ identifies its producing source for fan-in. A configuration is:

```math
C = \langle M, J, \eta, \phi \rangle,
```

where $`J`$ is join state, $`\eta`$ is the append-only event sequence, and $`\phi`$ is run phase. The transition relation $`C \longrightarrow C'`$ describes one control-kernel reduction.

## Why a hybrid statechart and token model?

Harel’s statecharts add hierarchy, orthogonality (concurrent regions), and communication to conventional state machines. Those ideas are essential for comprehending large agent organizations. Pure statecharts, however, do not by themselves make arbitrary workflow fan-in policies or producer-keyed payload assembly obvious. Token semantics, associated with Petri-net and workflow-pattern traditions, make split and synchronization behavior explicit.

Workflow v2 therefore uses scopes as the hierarchical authoring structure and tokens as the execution structure. This is a semantic combination rather than a visual imitation of any one editor. Foundational references are:

- David Harel, “Statecharts: A Visual Formalism for Complex Systems,” _Science of Computer Programming_ 8(3), 1987, [doi:10.1016/0167-6423(87)90035-9](<https://doi.org/10.1016/0167-6423(87)90035-9>).
- Wil M. P. van der Aalst, Arthur H. M. ter Hofstede, Bartek Kiepuszewski, and Alistair P. Barros, “Workflow Patterns,” _Distributed and Parallel Databases_ 14(1), 2003, [doi:10.1023/A:1022883727209](https://doi.org/10.1023/A:1022883727209).
- Wil M. P. van der Aalst, “The Application of Petri Nets to Workflow Management,” _Journal of Circuits, Systems and Computers_ 8(1), 1998, [doi:10.1142/S0218126698000043](https://doi.org/10.1142/S0218126698000043).
- [W3C State Chart XML 1.0](https://www.w3.org/TR/scxml/), which provides a standardized state-machine execution vocabulary.

## Activity reduction

An activity consumes one token and may eventually produce a value and disposition. Let $`A_n(v,c)`$ denote the observation returned by activity node $`n`$:

```math
A_n(v,c) = \langle v', d \rangle.
```

For a deterministic gateway, input, or pass-through transform, $`v'=v`$ and $`d=\mathtt{completed}`$. For an agent or external effect, $`A_n`$ is an observed input rather than a mathematical function the platform can reproduce. The control kernel records or routes the observation; it does not assert that repeated invocation yields the same $`v'`$.

An output or final node removes the token and produces the terminal value. A wait, approval, retry timer, or durable-yield boundary removes the hot token and records it in `pendingWaits`. An authenticated command with the exact run, revision, qualified wait identity, and command class reintroduces that token in route or retry phase. The encrypted checkpoint, rather than the public run record, contains the token value.

## Route-group reduction

For source node $`n`$ and disposition $`d`$, let the eligible group transitions be:

```math
E_{n,d,r} = \{e \in E \mid s(e)=n \land \tau(e)=d \land \rho(e)=r\}.
```

Here $`\rho(e)`$ is the route-group identity. Evaluate each total guard against the current output and context.

### First match

Order $`E_{n,d,r}`$ by ascending pair $`\langle p(e),\operatorname{id}(e)\rangle`$. Unique priorities are required, while the ID tie-break keeps the algorithm total for defensive determinism. Select:

```math
e^* = \min \{e \in E_{n,d,r} \mid g_e(v,c)=\mathsf{true}\}.
```

If the set is empty, apply the group’s no-match disposition. Otherwise emit exactly one target token.

### All matches

Select the set:

```math
E^* = \{e \in E_{n,d,r} \mid g_e(v,c)=\mathsf{true}\}
```

and emit one target token for every $`e \in E^*`$. Empty $`E^*`$ invokes the no-match policy exactly once.

### Literate router algorithm

```text
ROUTE(node, value, disposition, context):
  # Trigger filtering happens before guard evaluation. A failed activity cannot
  # accidentally traverse a completed route merely because its predicate is true.
  groups <- outgoing route groups whose trigger equals disposition

  for group in groups ordered by id:
    routes <- group.transitions ordered by (priority, id)
    truth  <- [(route, EVALUATE-PURE(route.guard, value, context))]

    # First-match establishes mutual exclusion; all-match establishes explicit
    # fan-out. The no-match action is singular in either case.
    selected <- FIRST-TRUE(truth) if group.mode = firstMatch
                else ALL-TRUE(truth)
    if selected is empty:
      APPLY(group.noMatch)
    else:
      for route in selected:
        EMIT(ADVANCE-COUNTER-OR-YIELD(route, value, context))
```

## Bounded transition rule

Let transition $`e`$ have positive bound $`b_e`$. It is enabled only while $`\kappa_c(e) < b_e`$. Traversal functionally updates that one counter:

```math
\kappa_{c'}(x) =
\begin{cases}
\kappa_c(e)+1 & \text{if } x=e, \\
\kappa_c(x) & \text{otherwise.}
\end{cases}
```

When the bound is exhausted, the transition produces `iterationLimit` instead of a target token. Counters belong to token context rather than a deployed team, so concurrent invocations and branches cannot consume one another’s budgets.

## Join semantics

Let $`P_n`$ be the distinct producer keys expected by join node $`n`$, and let partial map $`j : P_n \rightharpoonup V`$ contain arrived values.

- **Each:** fire once for every arrival; no accumulation.
- **All:** update $`j[q \mapsto v]`$ and fire when $`\operatorname{dom}(j)=P_n`$.
- **Quorum $`k`$:** fire when $`|\operatorname{dom}(j)| \ge k`$.
- **Race:** fire on the first arrival and apply the configured late policy thereafter.
- **Reduce:** combine arrivals with first, last, sum, minimum, maximum, or conflict-detecting record merge until the declared completion condition holds.

The value delivered by `all` and `quorum` is the producer-keyed map. This preserves the existing Embers fan-in convention: an agent receives a mapping from producing agent label to output.

The durable runtime carries a stack of fork epochs and correlation labels in every token. Join state is keyed by node and derived correlation, so overlapping loop generations remain distinct. Key correlation evaluates the declared portable value path; route-group correlation selects the corresponding fork epoch; root correlation selects the root epoch. Late arrivals follow the join's explicit ignore, fail, or next-epoch rule.

## Progress-boundary theorem

Define:

- $`N_W \subseteq N`$ as wait nodes;
- $`E_B \subseteq E`$ as bounded transitions;
- $`E_Y \subseteq E`$ as durable-yield transitions.

Construct the **hot residual graph**:

```math
H = G[N \setminus N_W] - (E_B \cup E_Y).
```

In words, delete wait vertices and delete every bounded or yielding edge.

**Theorem.** Every directed cycle in $`G`$ contains a progress boundary if and only if $`H`$ is acyclic.

**Proof.** Suppose every directed cycle in $`G`$ contains a progress boundary. Any cycle in $`H`$ would contain no wait vertex and no bounded or yielding edge by construction, contradicting the supposition. Therefore $`H`$ is acyclic. Conversely, suppose $`H`$ is acyclic. A cycle in $`G`$ that contained no progress boundary would survive every deletion and therefore be a cycle in $`H`$, a contradiction. Thus every cycle in $`G`$ intersects a progress boundary. $`\square`$

This is stronger than checking whether each strongly connected component contains at least one boundary. A large component can contain a safe outer loop and an unsafe inner loop that bypasses it. The residual-graph test detects the inner loop exactly.

### Validation algorithm

```text
PROVE-HOT-CYCLE-SAFETY(workflow):
  # Removing progress boundaries turns the universal statement
  # “every cycle intersects a boundary” into ordinary cycle detection.
  hotNodes <- nodes excluding wait nodes
  hotEdges <- transitions with neither a bound nor a durable yield,
              restricted to hotNodes

  # Tarjan's algorithm is linear in the residual graph size and identifies
  # self-loops as well as multi-node cycles.
  for component in TARJAN-SCC(hotNodes, hotEdges):
    if size(component) > 1 or component contains a self-loop:
      reject with the component's node identities
  accept
```

The complexity is $`O(|N|+|E|)`$.

## Determinism envelope

For a fixed definition, fixed pinned agent code, and fixed activity observations, the control trace is deterministic up to the commutation of independent parallel reductions. First-match priorities, sorted identities, pure guards, and token-local counters remove hidden scheduler choices from routing.

This is a confluence-style claim about independent control steps, not about external activities. Two sends to unrelated persistent contracts may reduce in either order but produce the same multiset of downstream tokens. A race join intentionally observes arrival order and is therefore nondeterministic by specification.

Rholang is a natural target because its communication model derives from the reflective higher-order $`\rho`$-calculus. Persistent contracts represent reusable transition rules; fresh names isolate invocations; parallel composition represents fan-out. See Meredith and Radestock, “A Reflective Higher-order Calculus,” [doi:10.1016/j.entcs.2005.05.016](https://doi.org/10.1016/j.entcs.2005.05.016).

## Safety and liveness properties

The present control kernel is designed around these properties:

1. **Reference safety:** every published source, target, scope, route group, and pinned agent reference exists.
2. **Counter safety:** a bounded edge is traversed at most its declared count per token context.
3. **Hot-cycle safety:** one hot execution cannot follow unbounded control transitions forever in a finite workflow.
4. **First-match exclusivity:** at most one edge fires per first-match group activation.
5. **All-match completeness:** every true edge fires per all-match group activation.
6. **Run-event order:** the run creation event precedes every committed effect/guard observation and terminal event, which precedes the social reply; the canonical inspector journal preserves both durable-kernel and public-ledger relative order.
7. **Revision safety:** each successful public advancement increases the revision by exactly one and clears any claimed command.
8. **Artifact confidentiality:** prompts, values, credentials, continuations, observations, and output bytes remain encrypted in F1r3drive; the ledger exposes hashes and metadata only.
9. **Hierarchical isolation:** child effect/guard keys include execution identity, and commands reach a child only through its qualified wait path.
10. **Terminal length:** a social terminal reply contains at most 280 Unicode scalar values.

Liveness remains conditional. An external agent may never respond, an approval may never arrive, and a fair scheduler cannot manufacture a missing event. Implemented activity timeouts, timers, cancellation, retry, and compensation let definitions handle those cases explicitly, but progress still depends on validator/storage availability and any required human authority.

Temporal reasoning follows the tradition introduced by Amir Pnueli, “The Temporal Logic of Programs,” _18th Annual Symposium on Foundations of Computer Science_, 1977, [doi:10.1109/SFCS.1977.32](https://doi.org/10.1109/SFCS.1977.32). The accompanying [TLA+ model](../formal/README.md) checks a finite abstraction of counter safety, hot-step bounds, terminal immutability, and causal event ordering; it does not prove the Rust or Rholang implementation by refinement.

## Soundness boundary

Classical workflow-net soundness asks, roughly, whether completion remains reachable without leftover work and every transition can participate in some execution. Workflow v2 is more general: cycles, durable waits, approvals, cancellation, race, and multiple terminal dispositions mean “one token in one sink” is too narrow.

A future generalized soundness analysis should be disposition-relative:

```math
\operatorname{Sound}(W,D) \equiv
\operatorname{optionToComplete}(W,D) \land
\operatorname{properCompletion}(W,D) \land
\operatorname{noDeadControl}(W,D),
```

where $`D`$ is the set of accepted terminal dispositions. That analysis belongs beside, not inside, the current exact hot-cycle proof.
