# ADR-004: Grant-Based Channel Connectors, Not Custodial Adapters

## Status

Accepted

## Context

Agent Teams had one external interface: F1r3sky, a bespoke in-backend social
adapter (`run_on_firesky.rs`) triggered client-side from the f1r3sky web
composer. Two more channels were required — chat (Discord, Slack, Mattermost,
Telegram, through F1R3BotGateway) and mail (chain-backed SMTP, through F1R3Mail)
— and both share a property F1r3sky never had to face: the triggering human's
wallet is **not present** at the moment the run must start. A chat message or an
inbound mail arrives at a long-running service; something must sign the run
deploy, and whatever signs it is, on the pre-existing ledger, the run's owner.

Doing nothing was not neutral. Without a designed answer, each channel would have
grown its own ad-hoc one — most cheaply a custodial wallet per service, which
silently converts "the user's run" into "the operator's run": operator-visible
outputs, operator-owned audit trails, and a revocation story of "ask the operator
to stop".

The run ledger already contained two verified precedents pointing at a better
answer: the wait-level delegated-approver ACL (`approval_authority_grants`,
`waitId|address` entries adjudicated by `claimCommand`) and the owner-adjudicated
output reveal (`claimOutputReveal`). Both authorize a *specific identity* for a
*specific narrow action* against a *public record* — exactly the shape a channel
needs, generalized from one wait to one team.

## Decision

Build a **generic, grant-based channel-connector layer** in the embers backend
now, and route both new channels through it:

1. **On-chain grants** (agents-teams env v3): a user signs a standing record —
   "channel wallet C may initiate runs of team T owned by me, within caps; C may
   reveal outputs for delivery; C may issue the listed command classes" —
   revocable by its grantor at any time, adjudicated by the chain at claim time.
2. **Runs are grantor-owned, channel-paid.** `beginDurableRunUnderGrant`
   adjudicates the grant atomically with run registration (one Rholang join over
   the runs and grants state) and registers `owner = grantor` with a `grant_id`
   link; the channel wallet signs and pays.
3. **The transport is unchanged.** After registration, a granted run is a plain
   durable run: `GET /runs/{run_id}` to poll, the reveal pair to fetch output
   (extended on chain to owner-or-grantee-with-reveal), the command envelope to
   act (extended with a grant branch). No webhooks, no push, no new streams.
4. **Bindings** make teams addressable per channel (mail addresses on chain,
   carrying no key material; chat aliases in the gateway's workspace store), and
   a three-valued `published-channels` aggregation reports reachability without
   fabricating answers.
5. **F1r3sky is not rewritten.** Its client-signed path already yields
   user-owned runs; migrating it onto the connector layer is a documented
   follow-on.

The full architecture is
[external interfaces](../../agent-teams/architecture/external-interfaces.md); the
delegation model is
[channel grants](../../agent-teams/architecture/channel-grants.md); the
adversarial analysis is the
[channel-grant trust model](../../agent-teams/security/channel-grant-trust.md).

## Rationale

- **Ownership is a ledger concern, so the fix belongs in the ledger.** Any
  purely off-chain delegation (API keys, service-side allowlists) would leave
  the on-chain owner wrong and every downstream authority (reveal, commands,
  anonymity scrubbing) wrong with it.
- **Revocability had to be real.** The platform's
  [capability model](../../agent-teams/security/capability-model.md) records
  that nothing pre-grant was revocable mid-flight. A channel is precisely the
  authority a user will want to cut quickly; the grant's `revoked` flag is
  checked at claim time, making revocation delivery-effective immediately while
  in-flight runs still complete for their owner.
- **One model amortizes across channels.** Chat and mail differ only in
  principal format and delivery transform; a shared grant record, error-code
  taxonomy, and adjudication clause mean the third channel (and f1r3sky's
  eventual migration) is configuration plus delivery code, not a new
  authorization design.
- **Staleness had to be safe.** Channel services cache grants for routing; the
  atomic join re-adjudicates at deploy time, so a stale cache costs one failed
  paid deploy rather than a wrong authorization — the availability/safety split
  the chain-read-first rule is built on.

## Consequences

### Positive

- Runs triggered from chat or mail are owned by the human's wallet; outputs are
  revealed to channels only under explicit, revocable, capped authority.
- The audited surface is one operation family (14 operations) with
  machine-readable error codes, documented per method, rather than per-channel
  bespoke endpoints.
- Channel wallets are ordinary funded wallets with bounded blast radius; the
  embers service key gains no new holder.

### Negative

- Chat and mail users must hold an embers wallet identity and sign a grant
  once in the embers UI before their first run — a real onboarding step
  (`team whoami` and the no-grant refusal are designed around it).
- The agents-teams env version bump (v2 to v3) empties env state: development
  stacks reset, and production requires an explicit state-migration deploy
  before rollout.
- Fourteen new operations and two new trust domains (gateway, bridge) widen the
  documentation and audit surface; the method docs and threat-table additions
  carry that cost.

## Alternatives Considered

### Client-side custodial channels (rejected)

Each channel service holds a custodial wallet that signs and owns runs on users'
behalf. Rejected because ownership lands on the operator: outputs become
operator-visible (reveal is owner-adjudicated), the anonymity scrubbing protects
the wrong party, per-user caps and revocation reduce to operator policy, and a
service compromise owns every user's runs at once. The rejected shape survives
nowhere in the build: a `CustodialRunsForDevOnly` rehearsal flag was planned
for the window before the grant endpoints existed, but they landed first and
the mail bridge shipped grant-native, so the flag was never written.

### Per-channel bespoke backend adapters (rejected)

Extend the f1r3sky pattern: one hand-built adapter module per channel inside the
embers backend. Rejected because it scales linearly in audited surface (each
adapter re-invents triggering, authorization, delivery, and error semantics),
puts channel credentials inside embers (the mail case would have demanded
mailbox keys embers must never hold), and leaves ownership unsolved for
channels where the user's wallet is absent — the adapter would still need
either custody or grants underneath.

### Webhooks / push delivery (deferred, not rejected)

Let channels register callbacks so embers pushes run events instead of being
polled. Deferred: the run/poll/reveal transport already carries every outcome
(the f1r3sky lesson — correctness must never depend on a delivery call
surviving), push adds an outbound-callback surface with its own authentication
and retry semantics, and the roadmap's P2 trigger-normalization item is the
designed home for it. Grants landed as that item's authorization half; event
streams remain future work.

## References

- [Channel grants](../../agent-teams/architecture/channel-grants.md) — record
  schema, adjudication clause, cap clock.
- [External interfaces](../../agent-teams/architecture/external-interfaces.md) —
  the three-channel architecture and transport.
- [Channel-grant trust model](../../agent-teams/security/channel-grant-trust.md)
  — spoofing and compromise analysis.
- [Feature roadmap](../../agent-teams/roadmap.md#scheduling-subscriptions-and-event-streams)
  — the P2 item grants partially delivered.
- Mark S. Miller, "Robust Composition: Towards a Unified Approach to Access
  Control and Concurrency Control," PhD dissertation, Johns Hopkins University,
  2006.
  [https://papers.agoric.com/assets/pdf/papers/robust-composition.pdf](https://papers.agoric.com/assets/pdf/papers/robust-composition.pdf)
