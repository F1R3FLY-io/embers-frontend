# The techniques, and why each is used here

Companion to [the strategy](./README.md). This document explains the reasoning
behind each testing technique the repository uses, so that a reader can judge
when to reach for one and when not to.

---

## 1. Example-based testing

The familiar kind: choose an input, state the expected output. Its strength is
that it documents intent — a well-named example says what the code is _for_.
Its weakness is that it examines exactly the inputs someone thought of.

The repository uses examples for behaviour that is specific rather than
general: that a failed pre-deploy save does not navigate, that unpublishing
names the handle, that the cascade runs unpublish before delete.

---

## 2. Property-based testing

A property test states a law that must hold for _all_ inputs and lets the
library search for a counterexample. Where an example test asserts
`f(3) = 9`, a property asserts

```math
\forall x \in \text{Input} \;.\; P(f(x))
```

and the library samples `x`, shrinking any failure to a minimal case. The idea
and the shrinking algorithm are due to Claessen and Hughes
([QuickCheck](https://doi.org/10.1145/351240.351266), ICFP 2000); this
repository uses [fast-check](https://fast-check.dev/).

### What it is good for here

**Codecs and round-trips.** A round-trip law — `decode(encode(x)) = x` for every
representable `x` — is exactly the shape a property expresses well. The entity
suite generates every valid secp256k1 secret (a scalar in `[1, n)`) and asserts
that each derives an address passing its own checksum, and that corrupting any
single byte is always detected. An example test shows one address round-trips;
the property shows no representable key produces a bad one.

**Totality.** "This never throws, whatever it is given" is a property over
`fc.anything()` and is otherwise tedious to assert. Used for `verifyAddress`,
for the workflow projection, and for the OSLF state gate.

**Server-shaped inputs.** The most valuable property in this repository
reproduces a _shape_ rather than a value. Rust serializes an absent `Option` as
an explicit `null`; an editor-built document simply omits the key, because
`JSON.stringify` drops `undefined`. A hand-written fixture naturally has the
editor's shape, which is why an example-based round-trip suite stayed green
while a backend-reloaded definition blanked the editor. Generating the server's
shape catches it by construction.

### What it costs

A property is only as good as its statement, and a wrong law is worse than no
law because it looks like assurance. Three of the laws written during this
campaign were refuted by fast-check within seconds, and each refutation was
informative:

- _"Every canvas produces a definition that validates."_ False. The editor is
  permissive and the validator strict — the documented split between saving a
  draft and deploying it. The law was narrowed and its complement added.
- _"No `%N` placeholder survives substitution."_ False when a field's value is
  itself `%1`. Replaced with a stronger law: a marker-shaped value is inserted
  literally, exactly once per placeholder — which also guards against a
  generator re-scanning its own output.
- _"The event schema refuses any non-numeric cost."_ False: `BigInt("")` is
  `0n`, so an empty cost parses as zero. The law was restated to match what the
  code actually does, and the coercion pinned separately.

### Seeds

Seeds are deliberately **not** pinned. A fixed seed makes every run examine the
same inputs, which turns a property test into a slower example test. Coverage
accumulates across runs instead. Reproducibility is not lost: fast-check prints
the seed and the shrunk counterexample on failure, and `FC_SEED=<n>` replays it.

---

## 3. Test doubles, and choosing the seam

A double replaces a collaborator. _Which_ collaborator decides what the test can
still prove.

The rule used here: **substitute at the boundary, not inside the logic.** A test
that mocks `@/lib/queries` can only show that a component called a hook; what
the hook does with the answer — poll until a record appears, roll back an
optimistic delete — is exactly the part that has broken before, and mocking the
module hides all of it.

Three seams, in order of preference:

1. **Inject a transport.** Every SDK service accepts a `fetchApi`, so a test
   hands it a scripted transport. Scoped to one instance, no global patching,
   and — importantly — nothing under test is skipped: the generated client
   still builds the URL, headers, and body, and only _then_ calls the injected
   function. The seam is below serialization, not above it.
2. **Supply the context.** Provider-level tests give the real component a real
   provider with a controlled value.
3. **Replace the module.** Reserved for things that cannot run in the
   environment at all — the WebAssembly parser under jsdom — and for
   components whose rendering is irrelevant to the property under test.

This is why MSW was evaluated and removed. It was adopted on the reasoning that
the app constructs its SDK internally and offers nothing to inject through —
true of the running app, false of a hook test, which supplies the wallet context
itself. Once that was noticed, MSW's only remaining effect was to patch the
process's global fetch. The dependency was removed rather than left installed.

---

## 4. Why a browser tier is not optional

jsdom is a DOM implementation, not a rendering engine. It has no layout and no
cascade for custom properties. Two consequences follow, and both produced
shipped defects:

- **Every bounding box is zero.** An element collapsed by a flexbox rule and a
  healthy one are indistinguishable. Defect 7 in
  [the ledger](./LEDGER.md#7-teams-could-not-be-deleted-a-zero-width-icon) was a
  delete control at zero width, with `display: block`, `visibility: visible`,
  and `opacity: 1`.
- **Computed colours are empty strings.** A label painted in its own background
  colour reads the same as a readable one. Defect 8 was exactly that.

The general statement: **any defect whose only symptom is geometry or colour
requires a real browser.** Adding tier-1 tests never closes that gap, however
many are added.

---

## 5. Regression tests must be shown to fail

A test written after a fix has never been observed failing, so nothing
establishes that it detects the defect. It may assert something adjacent, or
something trivially true.

Every fix in this repository was verified by:

1. copying the fixed file aside,
2. reintroducing the defect,
3. running the test and confirming it fails **for the expected reason**,
4. restoring the fix and confirming it passes.

Step 3 matters as much as the failure itself. When the team-delete guard was
checked this way it failed exactly three of five cases — the three asserting
that a dialog observes an idle loader — while the ordering cases still passed,
which is correct, because ordering was never the defect. A guard that failed
_all_ five would have suggested it was measuring something coarser than
intended.

---

## 6. Pinning behaviour without endorsing it

Some tests record what the code does today rather than what it should do. They
are marked `PINNED, NOT ENDORSED` and must state three things: the behaviour,
its consequence, and what would have to change before the behaviour does.

This exists so that a known wart stays visible instead of becoming folklore. It
also has a habit of turning into a fix: defect 3 began as a pin, and reading
back what the pin _said_ — that a caller awaiting finalization would report
success for a deploy that recorded nothing — made clear it was a defect. The
test was inverted and the code corrected.

The counterpart obligation is that a pin must never be used to avoid a fix that
is simply inconvenient. The distinction is whether the behaviour is
_defensible_: the empty-cost coercion is pinned because cost is informational
and never used for a decision, and the pin says so, naming the condition under
which it must be tightened.

---

## 7. Coverage as a signal, not a target

Coverage measures which lines ran, not whether anything was asserted about
them. It is useful in one direction only: a low number reliably indicates
untested code, while a high number indicates nothing in particular.

Two decisions follow. First, the **denominator must include files no test
imports** — Jest's default counts only imported files, so the figure _rises when
tests are deleted_. Second, thresholds are set just below the measured value so
that a **drop** fails, rather than at an aspirational number that fails
immediately and gets lowered.

Goodhart's observation applies with force: a coverage target becomes a target
for writing assertion-free tests. The thresholds here are a ratchet against
regression, not a goal.
