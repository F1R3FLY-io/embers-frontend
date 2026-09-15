# Red/blue demo maintenance and rehearsal

This guide covers preparation and maintenance outside the customer session.
Use the [customer runbook](../usage/red-blue-demo-runbook.md) during the demo
and the [integration testing guide](red-blue-demo-testing.md) to validate changes.

## Sources and graph

The authoritative demo files are under `demo/red-blue` in `embers-frontend`:

| File | Responsibility |
| --- | --- |
| [render.py](../../../demo/red-blue/render.py) | Prompts, wrappers, standalone agent files and runbook appendix |
| [lib/](../../../demo/red-blue/lib) | Shared Rholang decoding, calculations and review reconciliation |
| [graph.json](../../../demo/red-blue/graph.json) | Eight agents and 15 edges |
| [graph.py](../../../demo/red-blue/graph.py) | Workflow definition, keys, joins, guards, loop bounds and deployment membership |
| [fixtures/build.py](../../../demo/red-blue/fixtures/build.py) | Deterministic model-boundary fixtures |
| [protocol.md](../../../demo/red-blue/protocol.md) | Bounded RB1 record syntax and validation |

After changing generators or helpers, run from `embers-frontend`:

```sh
python3 demo/red-blue/render.py
python3 demo/red-blue/fixtures/build.py
python3 demo/red-blue/render.py --check
```

The appendix after `<!-- generated-agent-sources -->` is generated. Edit its
generator instead of manually changing those source blocks. The presentation
text before the marker can be edited directly. Keep its source links, agent
checklist, output keys, join settings and routes consistent with the graph.
Run the relevant integration checks before presenting changed behavior.

## Prepare a rehearsed backup

The simplest presenter workflow is to create, deploy, and query a team through
the UI before the session, retaining its successful run as a backup. The
customer runbook describes creating a separate team live. A saved team that
has never completed a query is not a rehearsed backup.

Maintainers can instead use [seed.py](../../../demo/red-blue/seed.py). It
requires sibling `embers` and `embers-frontend` checkouts and the backend's
Python test environment. Supply an explicit `--run-dir` so the script does
not select a development workstation's default state directory.

Set `EMBERS_DEMO_STATE_DIR` to an absolute path in your own private workspace.
Prepare this structure with a wallet funded on the target demo network:

```text
your-demo-state/
  wallet/
    address.txt
    <wallet-address>.json
```

`address.txt` contains the wallet address; the matching JSON is the generated
wallet file. For a container installation, export its wallet directory using
the setup guide, retaining both files. This directory holds private key
material and must not be committed or included in a customer handoff.

From `embers-frontend`, after setting that environment variable:

```sh
../embers/packages/embers/.venv/bin/python demo/red-blue/seed.py \
  --api 127.0.0.1:8080 --run-dir "${EMBERS_DEMO_STATE_DIR:?Set your private demo state directory}" \
  --seed --brief-file demo/red-blue/brief.txt
```

`--seed` creates new agents, team and deployment, and writes their IDs and URI
to `red-blue-demo.json` in that directory. The script prints the run ID before
waiting and saves the last completed run ID. Later queries reuse that state
by omitting `--seed`:

```sh
../embers/packages/embers/.venv/bin/python demo/red-blue/seed.py \
  --api 127.0.0.1:8080 --run-dir "${EMBERS_DEMO_STATE_DIR:?Set your private demo state directory}" \
  --brief-file demo/red-blue/brief.txt
```

The default query timeout is 900 seconds; `--timeout` changes the client
wait. Inspect the completed result and history, not just the seeder exit code.
Record whether it converged, exhausted its review budget, or returned
incomplete review. Seeding and manual creation both use actual model calls
when these production sources execute.

## Troubleshooting a rehearsal

Check authoring settings first:

- All eight agent nodes use `structured-v1` and the canonical output keys.
- ConstraintCheck and DecisionWriter use **Run for each arrival**.
- ReviewCoverage waits for every source and correlates by
  **Route-group fork epoch → ConstraintCheck · completed**.
- Decide uses the documented guard and first-match priorities; its revision
  edge has a maximum of **2** traversals and an `iterationLimit` route.
- The deployment container contains all eight agents; Input, Output, Decide
  and Limit remain outside it.

Inspect the run's agent history before resubmitting. A running query may still
be waiting for chain finality or encrypted checkpoint writes. Avoid overlapping
rehearsals; a bounded three-round run can take close to fifteen minutes under
load. A model timeout requires the configured service's logs.

With the combined image, from its Compose directory:

```sh
docker compose ps
docker compose exec demo /opt/demo/docker/healthcheck.sh
docker compose exec demo tail -n 100 /data/stack/embers.log
docker compose exec demo tail -n 100 /data/stack/val.log
```

After a container exits, its logs can still be copied before removing it:

```sh
docker compose cp demo:/data/stack/embers.log ./embers.log
docker compose cp demo:/data/stack/val.log ./validator.log
docker compose cp demo:/data/logs ./demo-logs
```

Follow the installation guide for Colima/Rosetta issues, API-key setup and
volume handling. Allow persistent storage to reconstruct after a restart;
do not reset the chain to address a slow mount. Preserve the wallet and data
volume. The development PDS identity/accounts are not reliably retained over
restarts: clear a stale F1r3sky session, sign in again, and republish as needed.

Workstation-specific startup scripts, profile locations, service-unit names
and historical log paths are retained in the local pgmcp development notes.
They are not part of the portable customer setup.

## Preparing the customer handoff

Send the setup guide, Compose file, optional mapping diagnostic, and the
complete [customer runbook](../usage/red-blue-demo-runbook.md). Its eight
inline source blocks make it usable without checking out the repositories.
Keep integration tests, source-generation instructions, historical evidence,
private wallet files and API keys out of the presentation bundle.

Use the [verification report](../usage/red-blue-demo-verification.md) internally
to distinguish historical passes from checks still pending. New example
queries should be rehearsed on the actual presentation environment before
claiming a tested result.
