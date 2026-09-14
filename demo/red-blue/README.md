# Red/blue engineering decision demo

Eight agents: six model agents and two local Rholang calculators. ConstraintCheck computes quantities from the current task; ReviewCoverage reconciles findings and responses. The team has 12 functional nodes, 15 edges, and a deploy container containing all eight agents on the current stack. A bounded loop permits one initial review and at most two revisions.

Follow the [live creation runbook](../../docs/agent-teams/usage/red-blue-demo-runbook.md) for source code, protocol selection, canonical output keys, joins, loop configuration, deployment, publication, and rehearsal commands. See the [verification report](../../docs/agent-teams/usage/red-blue-demo-verification.md) for completed checks and remaining limitations.

`render.py` and `lib/` generate the standalone sources in `agents/` and the runbook appendix. `graph.json` lists the members and edges; `graph.py` builds the Workflow v2 definition with stable output keys, correlated joins, bounded routing and deployment membership. The deterministic integration fixture replaces only the model boundary; it retains the actual decoders, calculators and result composition. Regenerate it with `fixtures/build.py` after changing agent sources.

Run `seed.py --seed --brief-file brief.txt` with the Embers integration environment from the runbook for a real model rehearsal. Public input is ordinary English. The model may use general engineering knowledge but has no live browsing tool. Extracted quantities retain their evidence and estimate labels; unknown values remain unknown. The [record protocol](protocol.md) documents validation and calculation limits.
