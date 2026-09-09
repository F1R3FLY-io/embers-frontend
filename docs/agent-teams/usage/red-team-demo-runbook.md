# Red-team query demo

The team proposes an answer, sends it to three critics, revises it, and returns a concise response.
The six agents are Hypothesize, LogicCritic, EvidenceCritic, FeasibilityCritic, Refine, and Condense.
Each critic receives the original query and the hypothesis. Refine receives all three critiques, the hypothesis, and the query.
Condense receives the refined answer and the query.

## Start the stack

Follow the [customer demo runbook](customer-demo-runbook.md) for the compatible node build, persistent profile, wallet, and frontend startup.
The default profile is `embers-local-stack/run/profiles/research-desk`. Both demos share this profile.
Open the Embers frontend at <http://localhost:5173>.

The live agents call the configured `rho:ai:gpt4` service. They do not retrieve documents from Chroma.
The model must return a non-empty answer. The shared Research Desk smoke check verifies the model service returns `PONG`.

## Verify integration

Run these commands before the demo:

```sh
cd ~/Workspace/f1r3fly.io/embers-local-stack
./stack.sh status
cd ../embers/packages/embers
uv run pytest tests/api/agents_teams/test_red_team.py -v --strict-services
```

Both tests must pass without skips. The first creates six agents, saves and deploys their team, and executes it on chain.
Its exact-output assertion verifies every broadcast edge and join input. The second verifies that raw-graph deployment rejects unresolved wallet-scoped agents.
These tests use deterministic agent bodies and do not call a model.

## Prepare the live team

The [demo assets](../../../demo/red-team/) contain six model-backed Rholang agents and the seeder.
The seeder uses the same graph builder as the integration test. Run it with the Embers Python environment:

```sh
cd ~/Workspace/f1r3fly.io/embers/packages/embers
uv run python ../../../embers-frontend/demo/red-team/seed.py --seed
```

Each `--seed` invocation creates a new set of agents and a new `RedTeam` deployment.
Seed once, then reuse the saved deployment for rehearsals. The seeder reads the funded wallet from the profile without printing its private key.
It saves public deployment metadata in `$EMBERS_STACK_RUN_DIR/red-team-demo.json`, using the default profile when that variable is unset.
Pass `--run-dir /absolute/profile/path` when using another profile.

## Rehearse a query

```sh
cd ~/Workspace/f1r3fly.io/embers/packages/embers
uv run python ../../../embers-frontend/demo/red-team/seed.py \
  --query "How should a small engineering team introduce mandatory code review without slowing urgent production fixes?"
```

This command calls the model through all six agents. It fails if the final response is empty or the workflow cannot complete.
Review the answer for a practical recommendation, explicit uncertainty, and mitigations for urgent fixes. Model wording can vary.

For the browser presentation:

1. Sign in with the wallet shown by `stack.sh status`.
2. Select **Agent teams** and open **RedTeam**.
3. Show the three critic branches and their join at **Refine**.
4. Open the deployed team runner and submit the prepared query.
5. Show the final answer. Explain which concerns each critic addresses.

Use the CLI rehearsal as a fallback if the editor loses its in-memory deployment state after a refresh.
The saved team URI remains in the profile's `red-team-demo.json`.

## Troubleshooting

| Symptom | Action |
|---|---|
| Deploy requires a 32-byte DeployId | Use the legacy-compatible node revision and build patch in the shared runbook. |
| Agents or the saved URI are missing after changing profiles | Seed the team in the selected profile. |
| Empty model response | Check the configured model key and run the shared `PONG` smoke check. |
| Deploy finalization stalls | Check both nodes and restart Embers after node recovery, as described in the shared runbook. |

The [earlier editor incident report](../../post-mortems/AGENT_TEAM_EDITOR_GRAPH_CORRUPTION.md) records the original red-team presentation and its graph-editing failures.
The live assets here recreate its six-agent topology. They are not an export of the earlier on-chain prompts.
