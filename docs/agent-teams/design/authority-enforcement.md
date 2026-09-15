# Proposal: enforce activity authorities as object capabilities

| Field         | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Status        | Proposed (application layer)                                                               |
| Target        | Embers Agent Teams compiler and durable kernel — no f1r3node, consensus, or Rholang change |
| Motivation    | The `authorities` declaration is validated and recorded but enforced by nothing at runtime |
| Supersedes    | Nothing; complements the [capability model](../security/capability-model.md)               |

This document proposes a mechanism, not an implementation. It specifies how the declared
`authorities` list on an activity's execution policy could become a real object-capability
control, why the design belongs in the application layer, and what would have to change to land
it. It is scoped so that no f1r3node, consensus, RSpace, or Rholang-grammar modification is
required — every change is in the Embers workflow compiler and durable kernel — which is why it
lives under `design/` rather than the protected-runtime `../FIPS/` process. If a future revision
needs a protected-runtime primitive (for example, a new registry powerbox facet), that part would
be split into a FIPS at that time.

Line anchors refer to branch `dylon/embers-demo-fixes` (backend commit `4a8b791`). Normative words
**must**, **must not**, and **may** describe the proposed behavior once accepted, not today's.

## Terms

Every term is defined before it is used elsewhere in this document.

| Term | Definition |
| --- | --- |
| Powerbox | The set of system channels (`rho:ai:gpt4`, `rho:ai:dalle3`, `rho:ai:textToAudio`, `rho:registry:lookup`) a compiled team may hold. In an object-capability system the powerbox is the sole source of primitive authority; everything else is derived from it by introduction. |
| Attenuation | Producing a weaker capability from a stronger one — here, handing an activity only the subset of powerbox channels it is entitled to, rather than all of them. |
| Authority (in this document) | A stable string naming one powerbox facet an activity is permitted to use, e.g. `rho:ai:gpt4`. Distinct from the run-command authorities analyzed in the [capability model](../security/capability-model.md). |
| Least privilege | Saltzer and Schroeder's principle that every component operate with the minimum authority its function requires ([doi:10.1109/PROC.1975.9939](https://doi.org/10.1109/PROC.1975.9939)). |
| Confinement | The property that a component cannot exercise authority it was not explicitly granted, even transitively. |

## Motivation and observed gap

An activity's execution policy carries `authorities: Vec<String>` (`workflow.rs:887`), and a
foreign-term activity carries its own `authorities` list (`workflow.rs:1000`). Both are validated
at publish time — but only for shape: `validate_authorities` requires each entry be non-empty and
unique and nothing more (`workflow.rs:656-666`, called for node policies at `:162` and for the
foreign-term list at `:795`). The kernel then copies the list verbatim onto every `EffectRequest`
(`runtime.rs:999`; struct field at `runtime.rs:1635`) and no code reads it again: an exhaustive
search finds no consumer of `EffectRequest.authorities` in `execute_activity` or anywhere in
orchestration. **The field is recorded intent with no runtime effect.**

The gap is sharpest by contrast with its enforced siblings on the same policy object:
`max_output_bytes` is checked in the kernel (`runtime.rs:244-250`) and `timeout` in orchestration
(`orchestration.rs:760-763`). An author who sets `authorities` reasonably assumes the same — that
naming `rho:ai:gpt4` confines the activity to that channel — but today the setting changes nothing.
Because that assumption is unsafe, the editor control for it has been hidden pending this proposal
(see the [capability model](../security/capability-model.md#recorded-but-unenforced)); this
document specifies the enforcement that would let the control return with real meaning.

## The enforcement seam: the powerbox is contract-wide today

The compiler grants system authority in one place. `system_channels` walks every node and returns
the **union** of the powerbox facets any activity references — text/image/audio models and registry
lookup — and injects that union into the single compiled team contract (`workflow_rendering.rs:179-207`;
the channels are `new`-bound into the whole contract body). A team with one `text-model` node and one
`rho:id:` activity holds both `rho:ai:gpt4` and `rho:registry:lookup` for the entire contract, and
**every** activity in it can reach **both**, regardless of what its own `authorities` list says.

This is the ambient-authority anti-pattern: authority is available to a component because of where
it sits, not because it was handed the capability. Object-capability discipline instead requires
that a component hold only capabilities introduced to it. The enforcement mechanism below closes
exactly this seam.

## Proposed model

`authorities` becomes the attenuation specification for the per-node powerbox. Formally, let
`$`\mathrm{ref}(n)`$` be the powerbox facets activity node `$`n`$` structurally references (what
`system_channels` derives per node today, but computed per node rather than unioned), and let
`$`\mathrm{auth}(n)`$` be its declared authority set. The compiler **must** hand node `$`n`$` the
capability set

```math
\mathrm{grant}(n) = \mathrm{ref}(n) \cap \mathrm{auth}(n)
```

and **must** reject the definition at publish time when `$`\mathrm{ref}(n) \not\subseteq
\mathrm{auth}(n)`$` — that is, when a node references a facet its authorities do not grant. An
activity that names no authority for a facet it uses is an authoring error, surfaced as a
diagnostic, not a silent broadening.

Two properties follow, both checkable:

- **Confinement.** A compiled activity contract holds exactly `$`\mathrm{grant}(n)`$` — no send on
  any powerbox facet outside it is reachable, because the name is never introduced into that node's
  scope. This is enforced structurally by Rholang `new` binding, the same nu-restriction that makes
  team names unforgeable (see [capability model](../security/capability-model.md)).
- **No amplification.** Because `$`\mathrm{grant}(n) \subseteq \mathrm{ref}(n)`$` and the union of
  all `$`\mathrm{ref}(n)`$` equals today's contract-wide set, enforcement can only remove ambient
  authority, never add it. Existing behavior is the special case `$`\mathrm{auth}(n) \supseteq
  \mathrm{ref}(n)`$` for every node.

## Mechanism

1. **Per-node powerbox derivation.** Refactor `system_channels` (`workflow_rendering.rs:179-207`)
   from a whole-definition union into a per-node function `$`\mathrm{ref}(n)`$`, and lower each
   activity node contract inside a `new` that binds only `$`\mathrm{grant}(n)`$`. The team contract
   still `new`-binds the union (for the manifest/control heads that legitimately need registry
   lookup), but no activity node closes over the union.

2. **Authority vocabulary.** Define the closed set of valid authority strings — one per powerbox
   facet the runtime can actually provide: `rho:ai:gpt4`, `rho:ai:dalle3`, `rho:ai:textToAudio`,
   `rho:registry:lookup`. `validate_authorities` (`workflow.rs:656-666`) tightens from
   "non-empty and unique" to "non-empty, unique, and drawn from the known-authority set", with a
   new publish diagnostic naming an unknown authority. The vocabulary is versioned with the schema
   so new facets extend it additively.

3. **Reference-subset check.** Add a publish rule (both validators, for parity) requiring
   `$`\mathrm{ref}(n) \subseteq \mathrm{auth}(n)`$` for every activity node — a definition that
   uses a channel it did not declare is rejected with a message naming the node and the missing
   authority. This is the rule that makes the declaration load-bearing.

4. **Foreign-term path.** `ForeignTerm.authorities` (`workflow.rs:1000`) is folded into the same
   vocabulary and subset check, but remains inert in effect while foreign-term activities
   themselves compile to the deterministic "unavailable until the governing FIPS is accepted"
   failure — the authority list gates nothing reachable until FLT support lands under its own FIPS.

5. **Runtime consult point (defense in depth).** The kernel, which already carries
   `EffectRequest.authorities` (`runtime.rs:1635`), gains an assertion that an effect dispatch
   requests no facet outside its node's grant. Under a correct compiler this is unreachable; it
   exists so a compiler regression fails closed rather than silently restoring ambient authority.

## Compatibility

- **Additive and backward-compatible.** A node whose `authorities` already list every facet it
  references compiles identically to today. Existing published definitions are unaffected: their
  authorities are either empty (in which case the subset check would reject only a definition that
  also references a facet — i.e., one that was relying on ambient authority) or already
  sufficient. A migration note would accompany the change: re-validate existing drafts; any that
  reference a facet without declaring it must add the declaration.
- **No wire or consensus change.** The schema gains only a tightened validation vocabulary; the
  serialized shape of `authorities` is unchanged. No f1r3node, RSpace, or Rholang-grammar
  modification is required — the powerbox facets already exist; only their scoping changes.
- **Editor.** The Authorities control returns (see below) as a checklist over the known
  vocabulary rather than free text, so an author cannot type an authority the runtime will not
  honor.

## Security analysis

Enforcement realizes least privilege and confinement at the activity boundary: a compromised or
misbehaving activity — including a foreign-term adapter, once those are enabled — can reach only
the model and registry facets its definition declared, not every facet any sibling happens to use.
This narrows the confused-deputy surface the [capability model](../security/capability-model.md#service-key-concentration-and-the-confused-deputy)
analyzes: the powerbox stops being ambient within a team. The mechanism adds no new authority and
cannot broaden any existing one (the no-amplification property above), so it is safe to land
incrementally. It does **not** address the run-command ACL hybrid, artifact-capability custody, or
the service-key concentration — those are separate items in the capability model and are out of
scope here.

## Acceptance tests

A conforming implementation passes each deterministically (Rust `cargo nextest run`; TypeScript
Jest for the validator parity):

1. **Attenuation.** A team with a `text-model` node authorized only for `rho:ai:gpt4` and a
   `rho:id:` node authorized only for `rho:registry:lookup` compiles so that neither node's
   contract can send on the other's facet (assert by inspecting the generated `new` scopes).
2. **Undeclared-use rejection.** A node that references `rho:ai:gpt4` without declaring it fails
   publish validation on both sides with a message naming the node and the facet.
3. **Unknown-authority rejection.** A node declaring an authority outside the vocabulary fails
   publish validation on both sides.
4. **Backward compatibility.** A node declaring every facet it references compiles byte-identically
   to the pre-change output for the same definition.
5. **No amplification.** No definition compiles to a contract in which a node holds a facet its
   grant excludes (property test over generated definitions).
6. **Runtime fail-closed.** With a deliberately broadened compiler output, the kernel's consult
   assertion rejects the effect rather than dispatching it.
7. **Foreign-term inertness.** A foreign-term node's authorities pass the vocabulary and subset
   checks but gate nothing, since the node still compiles to the deterministic unavailable failure.

## Editor reintroduction

Once enforcement lands, the execution-policy dialog's Authorities control (hidden by the honesty
change that accompanied this proposal) returns as a **checklist over the known authority
vocabulary**, defaulting to the facets the node references so the common case needs no interaction.
Because the vocabulary is closed and the subset check is enforced, the control can no longer imply
a capability the runtime will not honor. The `paletteHidden` foreign-language-term node stays
hidden on its own separate FIPS timeline; its authorities checklist rides along with FLT
enablement.

## References

- Jerome H. Saltzer and Michael D. Schroeder, "The Protection of Information in Computer Systems,"
  _Proceedings of the IEEE_ 63(9), 1975, [doi:10.1109/PROC.1975.9939](https://doi.org/10.1109/PROC.1975.9939).
- Mark S. Miller, "Robust Composition: Towards a Unified Approach to Access Control and Concurrency
  Control," PhD dissertation, Johns Hopkins University, 2006. [https://papers.agoric.com/assets/pdf/papers/robust-composition.pdf](https://papers.agoric.com/assets/pdf/papers/robust-composition.pdf)
- The [capability model](../security/capability-model.md) — the constructive authority model this
  proposal extends; the [roadmap](../roadmap.md) authority-budget and authority-flow items this
  enforcement is a prerequisite for.
