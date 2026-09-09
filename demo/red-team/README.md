# Red-team query demo

See the [red-team runbook](../../docs/agent-teams/usage/red-team-demo-runbook.md) for startup, seeding, rehearsal, and integration tests.

The six agent bodies call `rho:ai:gpt4`. The seeder uses the graph builder covered by `embers/packages/embers/tests/api/agents_teams/test_red_team.py`. The tests replace model calls with deterministic responses.
