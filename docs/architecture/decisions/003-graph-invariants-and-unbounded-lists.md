# ADR-003: Enforce Graph Invariants at the Boundary, and Never Cap Unbounded Lists

## Status

Accepted

## Context

Two defects in the agent-team editor cost a demo and a day of diagnosis, and neither
produced a signal where it failed. Both are analysed in
[the post-mortem](../../post-mortems/AGENT_TEAM_EDITOR_GRAPH_CORRUPTION.md); this
record exists so the standards drawn from them survive as project rules rather than
as recollection attached to one incident.

**A node deleted through the editor's context menu left its edges behind.** The menu
hand-built `{ type: "remove" }` node changes; `applyNodeChanges` drops the node and
does not touch edges, while React Flow's own `deleteElements` cascades to them. The
saved graph then named a vertex that nothing defined, and the compiler rejected it —
permanently, because the editor cannot draw such an edge and so showed nothing wrong,
and because load read the phantom straight back in and save wrote it out again.

**The sidebar's agent panel hid every agent past the sixth.** A `max-height: 300px`
against a 48px row pitch shows `floor(300/48) = 6` rows, and `overflow: hidden`
removed the scrollbar that would have reached the rest. It was invisible for as long
as there were six agents; creating a seventh activated it. No code change did.

Both are the same shape: a state the system could represent but should not, reaching
storage or the screen with nothing reporting it.

## Decision

### 1. A graph's well-formedness is enforced where it is written and where it is read

For a graph `$G=(V,E)$`, every edge must connect vertices that exist:

```math
\mathcal{W}(G) \;\equiv\; \forall\,(u,v) \in E:\; u \in V \;\wedge\; v \in V
```

`toApiGraph` will not emit an edge whose endpoints are not being written, and
`fromApiGraph` will not return one the graph does not define. Enforcing on *both*
sides is deliberate and not redundant: the write-side guard prevents new corruption,
and the read-side guard is what repairs graphs already stored — it makes load a
retraction onto the well-formed graphs, so opening a broken team and saving it
produces a sound one.

Violations are **filtered, not thrown**. A dangling edge carries no information, so
discarding it is a repair. This differs from a missing agent id, which represents
lost intent and does throw.

### 2. Mutations use the framework's own API, enforced by lint

Where a framework owns a model, the app calls its mutation API rather than
reconstructing the caller's half of it. Node deletion goes through
`rf.deleteElements`. An ESLint rule in `apps/embers/eslint.config.js` rejects
hand-built node removals within the GraphEditor.

The rule needs two selectors, because the mistake has two shapes — changes passed
inline, and changes bound to a variable first. Note that the obvious
`Property[key.name='type'][value.value='remove']` **does not match** the code that
caused the incident: `"remove" as const` is a `TSAsExpression`, not a `Literal`. The
committed rule nests `:has(Literal[value='remove'])` for that reason.

One exemption exists, at the site, with its justification: deleting a deploy
container re-parents its children rather than removing them, which `deleteElements`
cannot express because it cascades through `parentId`.

### 3. Content of unbounded length is never given a fixed height cap

A pixel `max-height` is a guess about how much content there will be. Applied to a
list that grows with user data it silently truncates, and the defect is invisible
below its threshold.

Panels holding user data use `max-height: none` and let an ancestor own the overflow;
`Accordion`'s `fitContent` prop is the sanctioned form. `overflow: hidden` is not
used on a capped element, since it converts an overflow into a dead end. A fixed cap
remains correct for genuinely bounded content, such as a log panel.

Recorded with an example in
[component patterns](../patterns/component-patterns.md#no-fixed-height-cap-on-content-of-unbounded-length).

### 4. A repair the user cannot see is reported

Dropping a dangling edge warns, naming the endpoints removed. A silent correction is
the same failure mode as the silent corruption it fixes: a connection the author drew
disappears and nothing says so.

### 5. Fixtures exceed any cap the component could plausibly have

Threshold faults are invisible below their threshold, so a fixture of six agents can
never expose a six-row cap. Render fixtures use nine.

## Consequences

**Accepted costs.** Removing the height cap loses the open/close easing on those
panels, because `max-height` cannot transition to `none`; both are `defaultOpen`, so
it shows only on a manual collapse. The lint rule is blunt enough to need one
documented exemption. The warning in (4) is unconditional rather than
development-only, because `import.meta.env` is unavailable under the CommonJS output
the tests run — a repair worth announcing in every environment.

**What this does not close.** The type system still permits the illegal state:
`Edge` carries ids as bare strings, so an edge naming a non-existent node remains
well-typed. Closing that needs identifiers branded by membership, a larger refactor
than this record commits to. The lint rule substitutes for it at the one site where
the mistake was actually made.

**Testing.** These invariants are covered by example-based tests over the exact
graphs that broke, and by property-based tests over generated graphs — including
deliberately corrupt ones — asserting `$\mathcal{W}$` holds after any round trip.
Clipping itself cannot be unit-tested: jsdom has no layout engine, so `scrollHeight`
and `clientHeight` are both `0`. The tests assert the mechanism; the outcome is
verified in a browser.
