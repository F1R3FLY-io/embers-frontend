# Customer demo runbook: the Research Desk

A 25-minute, deeply technical live demo of the Embers platform: an on-chain RAG research desk built as an Agent Teams v2 workflow with a bounded critique cycle, ChromaDB vector search and OpenAI completions as chain system processes, a human escalation gate commanded from the bearer run link, and a knowledge loop that files human-approved answers back into the retrieval corpus.

Audience: engineers and architects. Environment: the full local stack on one machine. Demo assets: [`demo/research-desk/`](../../../demo/research-desk/README.md). Team diagram: [`../diagrams/24-demo-research-desk.svg`](../diagrams/24-demo-research-desk.svg).

```
Question ──▶ Draft (Researcher) ──▶ Critique (Critic) ──▶ Decide (firstMatch)
                 ▲                                           │ #0 accept: output.score ≥ 80 ──▶ Answer
                 └───── revise (↻ ≤ 3, unconditional, #1) ───┤
                                                             │ iterationLimit ──▶ Escalation gate (approval)
                                                             │        ├─ completed ──▶ Archive (Archivist) ──▶ Answer
                                                             │        └─ rejected ──▶ Refused
```

## 1. One-time environment preparation (T-1 day)

### 1.1 libtorch 2.4.0 toolkit

The node's SBERT embedder (rust-bert via `tch`/`torch-sys` 0.17) requires exactly libtorch 2.4.0; a newer system PyTorch does not satisfy it. Download once into the stack's run tree:

```sh
cd ~/Workspace/f1r3fly.io/embers-local-stack/run
curl -sL -o libtorch.zip 'https://download.pytorch.org/libtorch/cpu/libtorch-cxx11-abi-shared-with-deps-2.4.0%2Bcpu.zip'
unzip -q libtorch.zip -d libtorch-extract && mv libtorch-extract/libtorch libtorch-2.4.0-cpu
rmdir libtorch-extract && rm libtorch.zip
```

### 1.2 Feature build of the node

```sh
cd ~/Workspace/f1r3fly.io/f1r3node-rust
LIBTORCH=$HOME/Workspace/f1r3fly.io/embers-local-stack/run/libtorch-2.4.0-cpu \
BZIP2_NO_PKG_CONFIG=1 \
cargo build --release -p node --features rholang/chromadb
```

Both environment variables are load-bearing:

- `LIBTORCH` points `torch-sys` at the 2.4.0 headers and libraries.
- `BZIP2_NO_PKG_CONFIG=1` makes `bzip2-sys` compile its vendored bzip2 instead of probing pkg-config. The probe emits `-L /usr/lib` into the link search path ahead of the libtorch directory, and the linker then binds `-ltorch_cpu` to the system PyTorch with incompatible symbols. The vendored build removes that search entry entirely.

Pre-flight drift check, repeat on demo morning (0 means someone rebuilt without the feature):

```sh
strings target/release/node | grep -c 'rho:chroma:collection'
```

### 1.3 secrets.env additions

Append to `embers-local-stack/secrets.env` (untracked; it already holds the OpenAI key the stack exports to the node). It is re-sourced by every `stack.sh` invocation, including inside the systemd units, so no `stack.sh` changes are needed:

```sh
export CHROMA_ENDPOINT="http://localhost:8000"
export LD_LIBRARY_PATH="$HOME/Workspace/f1r3fly.io/embers-local-stack/run/libtorch-2.4.0-cpu/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export KMP_BLOCKTIME=0
export JDK_JAVA_OPTIONS="-Djava.net.preferIPv4Stack=true${JDK_JAVA_OPTIONS:+ $JDK_JAVA_OPTIONS}"
```

`LD_LIBRARY_PATH` is required at node runtime: without it the loader resolves `libtorch_cpu.so` from the system and the feature binary fails to start. The four thread-pinning variables together disarm every spin-wait pool the bundled libtorch brings along (OpenMP intra-op, MKL, OpenBLAS, and the KMP busy-wait window). `OMP_NUM_THREADS=1` alone proved insufficient in practice: the validator still stalled silently (frozen log, one spinning core) under embedding and replay load with only OMP pinned. all-MiniLM-L6-v2 embeds in milliseconds single-threaded, so the pinning costs nothing.

`JDK_JAVA_OPTIONS` forces the IPv4 stack for every JVM the stack launches. F1r3drive is configured with `--host localhost`, the nodes bind IPv4-only, and Java's per-connection address selection sometimes picks IPv6 loopback — producing intermittent `Connection refused: localhost/[::1]:40401` channel failures in the drive that strand its file-write deploys and eventually hang the mount.

### 1.4 Chroma server (no Docker)

```sh
cd ~/Workspace/f1r3fly.io/embers-local-stack
python3 -m venv run/chroma-venv && run/chroma-venv/bin/pip install chromadb
systemd-run --user --unit=embers-demo-chroma --collect --property=Restart=on-failure \
  "$PWD/run/chroma-venv/bin/chroma" run --path "$PWD/run/chroma-data" --host 127.0.0.1 --port 8000
curl -s http://localhost:8000/api/v2/heartbeat   # must answer
```

Ordering rule: **Chroma must be up before the validator starts.** The node builds its Chroma client once at service init; if the server is unreachable the service silently degrades to NoOp (one info-level log line: "ChromaDB service could not be started") until the validator restarts.

## 2. Stack profiles: the one operational trap

`stack.sh` names its systemd units by a hash of the run directory (`sha256(run dir) → embers-local-stack-<hash>-*`). The stable customer-demo profile runs with `EMBERS_STACK_RUN_DIR=/tmp/embers-agent-teams-stable-run`. Two consequences:

1. **Always launch or restart with that env set** (or restart the existing units by name). Invoking `stack.sh` without it computes a different run dir, mints a second profile, and the new units crash-loop on ports the real stack still holds while `stop` misses the real units entirely.
2. If a stray profile does get created: stop its timer first, then its units, then `systemctl --user reset-failed` (the watchdog revives node units if it fires between your stops):

```sh
systemctl --user stop 'embers-local-stack-<strayhash>-node-watchdog.timer'
systemctl --user stop 'embers-local-stack-<strayhash>-*.service'
systemctl --user reset-failed
```

To move the running nodes onto a rebuilt binary without touching the rest of the stack (backend, F1r3drive, F1r3sky stay up; the units re-source `secrets.env` on every start):

```sh
systemctl --user restart \
  embers-local-stack-<hash>-validator.service \
  embers-local-stack-<hash>-read-node.service
```

A brief "Required ports are already in use" crash immediately after restart is a bind race with the old process; the unit auto-restarts and recovers within about 30 seconds. Deploys issued during the window time out harmlessly.

## 3. Seeding and verification (T-1 day, repeat morning-of)

```sh
cd ~/Workspace/f1r3fly.io/embers-frontend
pnpm install && pnpm --filter @f1r3fly-io/embers-client-sdk build
node demo/research-desk/seed/seed.mjs --all
```

`seed.mjs --all` runs, in order: smoke 00 (ChromaDB live end to end: create, upsert, query — the first upsert also warms the one-time ~80 MB SBERT model download), smoke 01 (gpt4 answers PONG; a disabled service returns an empty string), corpus seed (13 documents into `embers-demo-docs`), smoke 02 (query plus completion in a single deploy — the exact combination the agents use), agent create and deploy (Researcher, Critic, Archivist), team create and deploy from the fixture. It prints the team `rho:id:` URI and records state in `demo/research-desk/seed/.last-deploy.json` (gitignored: it holds the registry private key).

Additional checks:

```sh
grep -i 'ChromaDB service could not be started' /tmp/embers-agent-teams-stable-run/val.log   # must be empty for the current run
```

Frontend: `pnpm dev` (http://localhost:5173). Sign in with the wallet key from `/tmp/embers-agent-teams-stable-run/wallet/*.json` (the `value` field; the stack also prints a browser-importable JSON at `stack.sh up`).

For the optional F1r3sky act, confirm the dev network is serving: `curl -sf http://localhost:2583/xrpc/_health`. If it is down, `EMBERS_STACK_RUN_DIR=/tmp/embers-agent-teams-stable-run ./stack.sh backend` starts it and seeds the `user1.test` account. One nuance the guard does not cover: if the dev-env crashed after migrating its own fresh database (the `nohup`-spawned process also dies with the terminal session that ran `reset`, so this is common right after a bootstrap), `backend` refuses with "dev database contains state" even though the state is its own -- in that one case relaunch `dist/bin.js` directly with `cmd_backend`'s env; it resumes its schema cleanly. As a unit that survives terminal teardown:

```sh
NODE22="$HOME/.local/share/node-v22.23.1-linux-x64/bin"
systemd-run --user --unit=embers-demo-devenv --collect --property=Restart=on-failure \
  --working-directory="$HOME/Workspace/f1r3fly.io/f1r3sky-backend/packages/dev-env" \
  --setenv=PATH="$NODE22:$PATH" --setenv=NODE_ENV=development \
  --setenv=DB_POSTGRES_URL="postgresql://postgres@127.0.0.1:5432/f1r3sky" \
  --setenv=REDIS_HOST="127.0.0.1:6379" \
  "$NODE22/node" --enable-source-maps dist/bin.js
```

After any dev-env relaunch, recreate the seed account -- the PDS keeps accounts in process-local storage, so they do not survive a dev-env restart even though the appview database does (published-team accounts are likewise gone; republish from the editor when needed):

```sh
curl -s -X POST http://localhost:2583/xrpc/com.atproto.server.createAccount \
  -H 'Content-Type: application/json' \
  -d '{"handle":"user1.test","email":"user1@test.com","password":"password123"}'
```

Verify with the localhost publish suite: `uv run pytest tests/api/agents_teams/test_firesky_integration.py tests/api/agents_teams/test_published_state.py tests/api/agents_teams/test_unpublish.py` (8 tests, canned teams, no model calls).

The machine-checked verification is the backend integration suite, which never touches any network beyond localhost and never spends a model token. The choreography test drives the full routing (structured-v1 compile, the bounded revise cycle, iterationLimit, the live approve with `archived: false`, a malformed approve payload passing through) with canned Researcher/Critic and the real Archivist; the localhost RAG test adds real ChromaDB retrieval and closes the knowledge loop (escalate, answer through the gate with `archived: true`, re-ask, accepted from the archive):

```sh
cd ~/Workspace/f1r3fly.io/embers/packages/embers
uv run pytest tests/api/agents_teams/test_research_desk_demo.py -v
```

Model-touching rehearsal with the real gpt4-backed agents is a deliberate operator action (run the two prepared questions through the seeded team from the frontend, roughly six to ten gpt-4o-mini calls) — reserve it for the T-1-day rehearsal; it is never a pytest.

Finally, pre-stage the fallbacks in section 6: a completed happy-path run and a completed escalation run, with the dock JSON and the `/runs/...` pages captured as screenshots.

## 4. Reset procedure (between rehearsals)

- Agents, teams, and the Chroma collection persist on chain and in Chroma; re-running `seed.mjs --all` is idempotent (agents are reused by name, the team is saved as a new version and re-deployed to a fresh URI, corpus upserts overwrite by id).
- Do not refresh the editor tab after deploying live: the registry key and URI live in memory, and a refresh downgrades the Run button to Deploy (recovery: re-deploy, which mints a new URI).
- Full nuke only if the chain itself must be reset: `EMBERS_STACK_RUN_DIR=/tmp/embers-agent-teams-stable-run ./stack.sh reset` (interactive, destructive), then Chroma data still holds the corpus; re-run `seed.mjs --all` (about 15 minutes including genesis).

## 5. The 25-minute script

Two prepared questions:

- Happy path: **"What is the progress boundary rule for cycles?"** (in corpus; accepts on iteration 1-2).
- Escalation: **"What is the exact rotation schedule of the Zephyr-9 attestation committee?"** (a fictional platform internal, so it is unanswerable from BOTH the corpus and model pretraining; the Researcher must admit the gap and the Critic's rubric fails every draft, so the loop reliably exhausts. Do not substitute a general-knowledge question such as one about Bitcoin: the model answers those confidently from pretraining and the Critic accepts).

| Time | Beat | Talking points |
|---|---|---|
| 0-3 | Frame | Everything on screen is a signed deploy on a local F1r3fly shard. The LLM and the vector index are chain system processes: `rho:ai:gpt4` (OpenAI; the URN names the capability, the model behind it today is gpt-4o-mini) and `rho:chroma:*` backed by an in-node SBERT embedder. No GPU, no local LLM. |
| 3-6 | Agents | Open `research-desk-researcher` and `research-desk-critic` in the agent editor. Point at the URNs in the Rholang: vector search and completion are just channels. Mention the fixed-token verdict protocol and integer scores (floats are not portable; there is no string-to-int in Rholang — the ABI shapes the design). Show `research-desk-archivist` too: the knowledge loop is one more Rholang contract on a channel, and its archive/skip branch is a structural match, not a model call. |
| 6-12 | Build the team live | Dashboard, Agent Teams, create. Drag Researcher and Critic from the sidebar (pins are immutable agent versions). Draw input to Draft to Critique to Decide to Answer. Draw the revise back-edge Decide to Draft and DEPLOY WITHOUT A LOOP BOUND: the diagnostics panel rejects with `cycle-without-progress`. Open the transition modal, set maxIterations 3; the edge annotation `↻ ≤ 3` appears. "The editor just enforced a progress theorem" (hot-residual-graph check, Tarjan SCC, TLA+ models in docs/agent-teams/formal). Add the accept guard `output.score ≥ 80` (firstMatch, priority 0), the `iterationLimit` route to an approval node (owner, quorum 1, no timeout), and its rejected route to a final node. Drag the Archivist onto the gate's completed route (gate to Archive to Answer): the knowledge loop is one more node between the human and the output. Set all three agent nodes to structured-v1. |
| 12-15 | Deploy and run 1 | Deploy: narrate two-phase prepare, local sign, send — the wallet key never leaves the browser; the JWT binds the exchange, the signature is the only authority. Run with the happy-path question. Dock shows the final `{question, answer, feedback, score}` — no `archived` flag: the accept path bypasses the Archivist by topology, so accepted model output can never re-enter the corpus. Click the new "Open run inspector" link. The `/runs/` page is a bearer read capability: status, revision, event hashes — never content. |
| 15-19 | Run 2: the cycle earns its keep | Run the Zephyr-9 trap question. In the inspector, watch the event sequence: three revise generations, then `iterationLimit`, then the approval wait. Open the run link and sign in as owner. |
| 19-23 | The knowledge loop | Approve with a replacement payload — the human answers through the gate (integers only): `{"question": "What is the exact rotation schedule of the Zephyr-9 attestation committee?", "answer": "The Zephyr-9 attestation committee rotates every 400 blocks by stake-weighted round robin.", "feedback": "human-authored at the escalation gate", "score": 100}`. The "Command result (visible only to you)" block shows the record with `archived: true` — the Archivist filed it into the same collection the Researcher queries, over the signer's channel while the public ledger stays hashes-only. Now RE-ASK the same question: retrieval surfaces the archived Q&A, the draft grounds in it, and the run accepts at 80+. "The desk learned from its human, and the lesson is an on-chain artifact." One-liners if asked: an empty payload preserves the best-effort record instead (`archived: false` — the desk never learns its own refusal); Reject routes to Refused and the Archivist is never reached. Honesty note: the re-ask rides the live rubric — the archived document contains the answer verbatim, so grounding is strong, but the grade is still model-issued. |
| 23-25 | Detours and Q&A | Replay-cached nondeterminism: the chroma query and gpt4 results are recorded on first execution; replay validates without re-calling OpenAI. Encrypted continuations checkpoint to F1r3drive between macrosteps. The capability model doc names its own gaps honestly (recorded-but-unenforced authorities, the absent revoke) with filed proposals. Corpus seeding itself was an on-chain deploy. |
| optional | F1r3sky social act (time permitting) | Publish the team to F1r3sky from the editor's caret menu (account user1.test / password123 on the local dev network). The handle field pre-fills with a slug of the team name -- the Research Desk publishes as `@research-desk.test` -- and stays editable. Open http://localhost:19006 and mention the team's handle in a post: the backend runs the team and posts a bounded (280-scalar) terminal reply carrying the public run URL -- publication as capability transfer, and the reply's run link is the same bearer inspector shown earlier. When the reply truncates, close the loop: click the run link, sign in with the wallet that posted the mention (the mention-triggered run is signed by that user's own wallet, so they ARE the on-chain owner), and press "Reveal full response" -- the full text over the signer's channel, an "Output revealed" event on the public timeline, and a 403 for any other wallet. Note: a mention-triggered run invokes the real agents, so it spends a few gpt-4o-mini calls like any live run. The publish/unpublish/stale mechanics themselves are verified by the localhost-only suite (8 tests) without any model call. |

## 6. Failure fallbacks

| Failure | Detection | Response |
|---|---|---|
| Node lacks the chromadb feature | `strings` check; smoke 00 deploy fails outright | Rebuild per 1.2; restart nodes per section 2 |
| Validator goes silent for minutes: log stops mid-heartbeat, one worker spins ~50-60% CPU, deploy-service gRPC times out while HTTP `/status` still answers | Backend errors `show_main_chain failed ... Timeout expired`; no new val.log lines. perf-record of the spinning thread shows `imbl::HamtNode::get` under `block_dag_key_value_storage::is_in_main_chain`: the node's DAG main-chain walk is effectively unbounded on a long chain (~30k heartbeat blocks) and re-triggers after restarts recompute it | This is an algorithmic stall, not a deadlock -- it usually completes on its own in a few minutes, and the watchdog restarts the node if health checks fail. THE DEMO-DAY MITIGATION IS A SHORT CHAIN: run `EMBERS_STACK_RUN_DIR=/tmp/embers-agent-teams-stable-run ./stack.sh reset` the morning of the demo and reseed with `seed.mjs --all` (~15 minutes total); a fresh chain keeps the walk trivial for the whole session. File upstream against f1r3node-rust block_storage. (The libtorch thread-pinning in section 1.3 remains correct hygiene for the embedder but was not this stall's cause) |
| Zombie backend after node restarts: HTTP accepts requests but every deploy/transfer blocks until client timeout | Validator log is fresh and finalizing while `embers.log` has gone silent (the node-events stream died and did not resubscribe) | Restart the embers unit; verify `embers.log` resumes `block finalised` lines. After any validator or read-node restart, treat a backend restart as part of the procedure |
| Backend unkillable (survives SIGKILL) and its port stays bound; unit restart times out into failed mode | A thread in state `D` on wchan `request_wait_answer` (`ps -L -o pid,tid,stat,wchan= -p <pid>`): an orphaned FUSE request whose F1r3drive daemon died | Abort the dead FUSE connection: find the f1r3drive mount's device minor (`stat -c %Ld <mountpoint>`), check `/sys/fs/fuse/connections/<minor>/waiting` is nonzero, then `echo 1 > /sys/fs/fuse/connections/<minor>/abort`. The pending requests error out, the process reaps, the port frees. Then `EMBERS_STACK_RUN_DIR=/tmp/embers-agent-teams-stable-run ./stack.sh up` recreates the f1r3drive and embers units |
| The full stall cascade (understand it before treating symptoms) | Head of chain: the OBSERVER'S FINALIZER. The read node can be receiving and validating every block (fresh "processing finished" lines) while running no finalizer at all (zero `finalizer-run-finished` lines in `read.log`). Everything that checks finalization through the observer then stalls at once: F1r3drive polls `isFinalized` against the observer and loops `false` forever even though the validator finalized its deploy within a second (verify in val.log: "Removed 1 deploys ... as we finalized"), so it withholds FUSE replies (`timeout 5 ls <mountpoint>` hangs) and backend threads block in `request_wait_answer`; separately the backend's own finalization events ride `ws://localhost:40413`, so its node-events stream goes silent (frozen `embers.log`) and every deploy/transfer send hangs to client timeout | RESOLVED for the demo stack: `stack.sh serve-drive` now points the drive's finalization channel at the validator (`--observer-port 40401`), whose finalization is proven sub-second, so the drive no longer depends on the observer's finalizer at all. The observer behavior remains a node bug worth filing: a mid-chain-restarted observer validates blocks but never resumes finalization (zero `finalizer-run-finished` lines), solo or paired restart alike. If the backend still freezes, restart it after the drive |
| Chroma down or NoOp downgrade | Heartbeat curl; smoke 00 returns no document; val.log info line | Start Chroma, then restart the validator (client is built at node start) |
| Chroma dies mid-session; the approve's archive step fails | The approve's command result shows a suspended run holding a `retry:...` wait; `retryScheduled` in the inspector event trail | Restart Chroma only — no validator restart needed (the NoOp downgrade happens only when Chroma is down at node START). The kernel auto-retries at 10 s then 30 s; to expedite, send a signed `retry` command naming the `retry:` wait. If all 3 attempts exhaust, the run fails — re-run the question and answer through the gate again |
| OpenAI outage or bad key | Smoke 01 returns empty | No local LLM by decision: fall back to the pre-staged canned runs |
| 120 s finalization stall mid-demo | Spinner exceeds patience | Narrate the durable-kernel checkpoint story; the watchdog recovers nodes in 30-60 s; switch to the pre-deployed backup team (`seed.mjs` printed its URI) or the canned artifacts |
| Editor tab refreshed after deploy | Run button reads Deploy | Re-deploy (new URI); the backup team URI still works from the F1r3sky flow |
| Live graph build goes sideways | — | The fixture team is already deployed; open it and continue from Deploy |
| Critic accepts the trap question | Score 80+ on run 2 | Re-run once (the strict rubric makes this rare); if it persists, show `iterationLimit` by asking a second out-of-corpus question with the backup team |

## 7. Honesty notes for a technical audience

- `rho:ai:gpt4` currently binds gpt-4o-mini (`openai_service.rs`); say so plainly — the URN names the capability, not the model vintage.
- The run ledger's metadata-only design is a feature, not a gap: content hashes on chain, values over authenticated channels, artifacts sealed in encrypted F1r3drive storage.
- The chroma query and gpt4 calls are non-deterministic effects made consensus-safe by replay caching, not by determinism claims.
