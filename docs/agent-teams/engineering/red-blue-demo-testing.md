# Red/blue demo integration testing

This guide is for maintainers validating changes before a presentation. The
[customer runbook](../usage/red-blue-demo-runbook.md) covers live authoring,
deployment, example queries and inspecting results. Test commands are not
part of that presentation.

## Test environment

Use sibling checkouts named `embers` and `embers-frontend`, with the backend
test environment installed at `embers/packages/embers/.venv` and the frontend
dependencies installed through the repository's normal setup. Commands below
state which repository directory to use; no particular workstation path is
required. The published runtime image does not include these source test suites.

Use a running disposable demo network with validator, observer, block
production, F1r3drive, and Embers ready. Publication tests additionally require
the PDS/F1r3sky services; live-model tests require the configured model service
and its API key. Tests create wallets, agents, teams, deployments and runs.
Execute the suites sequentially so their chain mutations do not compete with
one another or with an ongoing presentation.

For a container exposing Embers on IPv4 loopback, use `EMBERS_API_URL=127.0.0.1:8080`
for Python tests (without `http://`). `--strict-services` turns unavailable
marked services into failures. Still inspect the summary for skipped tests:
opt-in flags have separate skip conditions, so a skipped test is not a pass.

## Check generated sources without starting services

From the `embers-frontend` repository root:

```sh
python3 demo/red-blue/render.py --check
```

This checks the eight generated agent files and the customer runbook's embedded
source appendix. It does not execute Rholang or certify the running stack.

## Deterministic Rholang and deployed workflow checks

From `embers/packages/embers`:

```sh
EMBERS_API_URL=127.0.0.1:8080 .venv/bin/python -m pytest \
  tests/api/agents_teams/test_red_blue_calculators.py \
  tests/api/agents_teams/test_red_blue_demo.py -v --strict-services
```

The calculator suite exercises the actual Rholang decoder, arithmetic,
unknown values, unit matching, correction attempts, finding reconciliation,
and final writer composition. These are service-backed checks even though
the arithmetic runs locally inside Rholang rather than in an external service.

The deployed suite covers first-round convergence, revision and reevaluation,
the three-round limit, malformed records, accepted risks, and nested deployment.
Its fixtures substitute the model boundary while retaining the real local
calculations, wrappers and output composition. It also checks retained agent
outputs and distinct invocation identities across repeated rounds.

## Publication and F1r3sky query checks

From `embers/packages/embers`, with the local PDS services available:

```sh
EMBERS_API_URL=127.0.0.1:8080 .venv/bin/python -m pytest \
  tests/api/agents_teams/test_red_blue_channels.py \
  -m pds -v --strict-services
```

This publishes a deployed team, creates an ordinary-English mention, checks
the reply/run link, and checks the retained DecisionWriter output. It uses
deterministic model fixtures, so it does not certify live-model behavior.

## Actual-model checks

From `embers/packages/embers`:

```sh
EMBERS_API_URL=127.0.0.1:8080 EMBERS_RED_BLUE_LIVE=1 \
  .venv/bin/python -m pytest \
  tests/api/agents_teams/test_red_blue_live.py -v --strict-services
```

These opt-in checks call the configured model. They cover reviewer/responder
record handling and deployed decisions across service-budget, code-review and
migration scenarios. They are distinct from the six F1r3node/Embers examples
in the customer runbook, which have not yet each been rehearsed end-to-end.
They incur model usage and can take several minutes per deployed query.

## Browser authoring and execution

From `embers-frontend`, configure `EMBERS_E2E_STACK_KEY` privately with the
hexadecimal private key of a wallet funded on the test network. The fixture
expects the key value, not a wallet JSON filename. Do not print or commit it.
Ensure the built application's API configuration points to the same service
as `EMBERS_E2E_API_URL`; that variable configures the test fixture, not the
application bundle.

```sh
pnpm --filter @f1r3fly-io/embers-frontend build
EMBERS_E2E_STACK=1 EMBERS_E2E_API_URL=http://127.0.0.1:8080 \
  pnpm --filter @f1r3fly-io/embers-e2e exec playwright test \
  --project=stack red-blue.stack.spec.ts --workers=1
```

The Playwright configuration serves the production build on port 4273. The
test creates all eight agents, replaces their full sources, selects
`structured-v1`, configures the joins and bounded loop, wraps the deployment
container, deploys, and executes a revision case. Confirm it ran rather than
skipping for a missing wallet or unavailable service.

## Optional between-round recovery check

`test_red_blue_channels.py` also has a `recovery`-marked test that pauses a
nested review, restarts Embers, and checks retained history and resumed output.
Its current restart driver uses a Linux user systemd unit supplied by
`EMBERS_SERVICE_UNIT`. It is not a Docker/Colima restart test. On a suitable
test host, set that variable to the actual test backend unit and run:

```sh
EMBERS_API_URL=127.0.0.1:8080 .venv/bin/python -m pytest \
  tests/api/agents_teams/test_red_blue_channels.py \
  -m recovery -v --strict-services
```

Run this after other rehearsals finish. Do not point it at a backend serving
a presentation. Workstation-specific unit names and startup commands belong
in local operational notes, not this guide.

## Record the result and its limits

Retain command output, exit status, test counts including skips, source
revision/image tag, environment, and completed run IDs in your test artifacts.
Separate deterministic passes, real-model outcomes, publication, browser
authoring and recovery results. A valid bounded stop requiring human review
is not evidence of convergence. A client timeout is not a test pass merely
because the run later completes.

The [verification report](../usage/red-blue-demo-verification.md) records
historical evidence, not proof for an arbitrary current installation. Mac
container startup was confirmed after installing Rosetta; full Mac demo
testing was still pending when these guides were split. See
[maintenance and rehearsal](red-blue-demo-maintenance.md) for generating
sources, preparing a backup team, and investigating a stalled run.
