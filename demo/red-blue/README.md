# Red/blue engineering decision demo

Eight agents: six model reviewers and two local Rholang calculators. The team has 10 functional nodes, 25 edges, and a deploy container containing all eight agents on the current stack.

Follow the [live creation runbook](../../docs/agent-teams/usage/red-blue-demo-runbook.md) for source code, canonical output keys, wiring, editable calculator assumptions, deployment, publication, and rehearsal commands.

`agents/` is authoritative. `graph.json` lists the members and edges; `graph.py` builds the Workflow v2 definition with stable output keys and deployment membership. The deterministic integration fixture replaces model agents only; both calculators execute their actual Rholang source.

Run `seed.py --seed --brief-file brief.txt` with the Embers integration environment from the runbook for a real model rehearsal. The model may use general engineering knowledge but has no live browsing tool. Scenario assumptions are not measurements inferred from a query.
