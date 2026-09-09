# Red/blue engineering decision review

Follow the [presenter runbook](../../docs/agent-teams/usage/red-blue-demo-runbook.md) to create all six agents and the team live.

`agents/` contains the live model-backed code. `graph.json` defines the connections shared by the seeder and tests. `brief.txt` is the prepared scenario. `fixtures/deterministic.json` supplies model-free acceptance cases. The seeder runs from the Embers Python environment and saves deployment metadata in the selected stack profile.
