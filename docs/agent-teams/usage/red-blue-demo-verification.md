# Bounded task-aware demo verification — September 11, 2026

Runbook: [Create the red/blue team during the presentation](red-blue-demo-runbook.md).

This revision replaces the fixed-value calculators with ConstraintCheck and ReviewCoverage, adds up to three review rounds through a real deployment container, and keeps model records bounded and decoded in Rholang. The team has eight agents, two gateways, Input and Output, and 15 edges. Dragging an agent defaults to simple-v1 without a popup; Edit node provides the two supported protocol choices in a dropdown.

## Current verification status

September 14: the upstream GC backport is now committed as `628b6bb14ad16a4ad91fc9d91bc3a736cec8aa6d` on `feature/embers-demo-gc` and both demo nodes are running it. The 20 GC, 11 finalization, and one Unicode regressions and the Chroma-enabled release build passed. The first normal scheduled GC passes took 20.07 and 20.90 seconds. See [backport verification and rollback](demo-gc-backport.md). The historical September 11 GC proposal described below has been replaced; `node-gc-history.patch` now reproduces the committed upstream backport.

The first September 14 query `01a0a169-73bd-7fa3-87a9-f338683a7c10` completed three rounds and delivered a response, but reported incomplete review because the model omitted prior finding E4 and returned an invalid/duplicate finding. The task capacity check stayed unknown. It is not counted as a clean red/blue semantic acceptance pass.

The owner-authenticated trace identified mismatched term/constraint units and invalid reviewer severity. The current wrappers validate exact units, retained finding IDs, resolution provenance, and response coverage before their existing single correction attempt. Validation errors identify the offending field; the prompts distinguish consumption from capacity and preserve supplied estimates. All **69 focused Rholang tests passed** in 25.05 seconds, including the new correction and arithmetic regressions (`red-blue-boundary-tests.log`).

The fresh deployed full-team query **`01a0a187-03fc-7413-bc38-577a79901332` passed the live bounded-review rehearsal**. All eight agents were created and deployed, and the full response completed three review rounds without record-validation errors. The proposed one-approval policy calculated **180 reviewer-minutes/day against the 240-minute limit, with 60 minutes of estimated headroom**, and met the six-PR/day target. Every recorded round reported zero unmet/unknown constraint checks. The terminal outcome was **review limit reached; human review required**, retaining one open blocker. This verifies execution, useful task-derived calculations, retained review history, and the bounded stop; it does not claim convergence or approval. The seeder exited successfully and saved this backup's team and run IDs to the profile's `red-blue-demo.json`. Evidence: `red-blue-boundary-live.log` and `red-blue-boundary-result.json` in the profile verification directory. This rehearsal does not replace separately scoped publication or restart tests.

### Earlier September 11 results

The subsequent recovery exposed a node Unicode defect: slicing a curly apostrophe by byte offset panicked during RedEvidence execution. The observer rejected that failed deployment's replay and could not replay later state roots. Character-based string length/slicing now passes all 115 interpreter tests; the Chroma-enabled node build passes. The patch is retained as `demo/research-desk/node-unicode-string.patch`. The observer was restored from a stopped validator snapshot; its original data and peer identity were preserved. F1r3drive now confirms writes through the validator while retaining observer-based exploratory reads; all 116 storage tests and the shaded JAR build pass. The interrupted observation's original encrypted bytes and missing directory membership were recovered and verified using exact snapshot checks (`restore-pending-unicode-observation.py` and its before/after snapshots in the profile verification directory). Storage reconstruction has completed and both F1r3drive and Embers are confirmed active. The restored-stack calculator checks passed 56 cases; the remaining Unicode decimal case passed after correcting the test fixture’s encoding and expected error prefix (`red-blue-unicode-restored-calculators-fixed.log`, `red-blue-unicode-decimal-regression.log`). The service-budget task passed full deployed execution and response checks (`01a08f27-7a91-7161-bf0f-53f81cbf5744`). The next code-review task exceeded its 900-second HTTP deadline during a validator stall, then reached completed revision 20 through recovery (`01a08f31-b4cf-7f41-977e-5e911611a1b4`); that task is not counted as a pass and the migration task did not run (`red-blue-real-domains-unicode-restored.log`). The saved-run browser recheck also timed out during the stall (`saved-run-browser-unicode-restored.log`). The stall began at 06:43:53 UTC, five minutes after the preceding GC completion, and ended when GC finished at 06:57:17. Mergeable-channel GC repeatedly traversed the entire chain for every historical block without yielding. Its traversal now caches each validator’s main-chain ancestry once, and collection runs on a blocking worker. The proposed correction passed all four fork/finality/depth and long-history regressions; the 50,000-block safety scan took 188 ms (`node-gc-history-tests-fixed.log`), and the production build passed (`node-gc-history-build.log`). The GC correction is retained solely as an unapplied patch for separate review (`demo/research-desk/node-gc-history.patch`). Its source changes were reversed, the launch binary was restored to the currently running version, and no services were restarted. It is excluded from the startup instructions. Further demo rehearsals have stopped; full current-demo acceptance has not passed.

The first full-model run after the node fix completed with an explicit incomplete
review (`01a08d58-6158-7fd2-8c42-2ad0f13191f2`). Its first-round reviewers returned
valid records and the local calculator computed the supplied $80/month estimate
against the $100/month bound. BlueResponder then copied a forbidden constraint
record and omitted responses. The strict validators rejected that revision.
The responder now receives an explicit checklist derived from the actual finding
ledger, an output example, and instructions for treating unknown facts as
mitigations without inventing a new action. All 32 Rholang regressions passed,
including rejection of copied and changed constraints. The focused real-model
responder check passed with valid actions for all nine supplied findings
(`red-blue-responder-actions.log`). The earlier focused failures remain in
`red-blue-responder-protocol.log` and `red-blue-responder-checklist.log`.
The next full-model run (`01a08d6a-e74a-71e3-a4d5-a3773ccd8ac1`) passed responder
validation but ended with incomplete review because RedLogic omitted prior
finding L1. Each reviewer now receives its own checklist of prior finding IDs,
including resolved findings. Both focused live-model reviewer checks passed:
first-round schema and second-round retention across all three reviewers
(`red-blue-reviewer-history-checklist.log`). All 35 Rholang regressions passed,
including minimum bounds and the migration task's additive 12 + 8 + 8 hour
calculation (`red-blue-calculators-reviewer-checklist.log`). Validators still
reject missing history and unsubstantiated resolutions. The full three-domain
rerun in `red-blue-real-domains-ledger-checklists.log` ended with incomplete review:
two reviewers retained their own IDs but also copied other reviewers' records.
Their prompts now receive only their own finding/response checklist, plus the
shared task, proposal and constraint checks. The complete ledger remains in the
returned state and trace. All 38 Rholang regressions passed, including checks for
prompt isolation and preservation of the shared ledger (`red-blue-reviewer-scope.log`).
All three focused real-model checks passed in 28.46 seconds
(`red-blue-scoped-model-protocols.log`): initial reviewers, revision reviewers and
complete responder coverage. The subsequent full-team run failed because RedEvidence inserted a semicolon inside a prose field (`red-blue-real-domains-scoped-reviewers.log`, run `01a08d8c-937c-7f63-9082-4e66a590127b`). Record-producing model agents now permit one correction attempt after a decoder or schema error, with unchanged strict validation and fresh per-attempt parsing state. A second invalid response remains incomplete review. The current sources pass all 53 local Rholang checks (`red-blue-format-error-detail-fixed.log`), including one-attempt success, correction after partially parsed data and rejection after two invalid answers for all five record producers. The initial-review, revision-review and responder live checks pass (`red-blue-format-correction-live.log`). The forced live correction test also passed, including the two-attempt bound (`red-blue-forced-format-correction-live-retry.log`). Its previous retry failed during wallet funding because validator chain-head reads timed out; node progress resumed without restarting. The three-domain deployed test failed with a submission-RPC timeout (`red-blue-real-domains-format-correction.log`), while its first run `01a08db1-b110-7ae1-92f4-24806e2b0122` continued through recovery into round three without record-validation errors. The orchestrator now reconciles a lost submission acknowledgement against finality of the exact persisted signed effect, without issuing a second submission in that attempt. It preserves on-chain failure and an unconfirmed error rather than treating either as success. All 205 backend tests and the build passed (`embers-effect-ack-all-tests.log`, `embers-effect-ack-build.log`). The backend has been restarted to load that fix; current deployment acceptance must still pass. Publication, restart and refreshed backup acceptance have not completed for this revision. Earlier correction-prototype failures are retained in `red-blue-bounded-format-live-protocols.log` and `red-blue-format-error-detail.log`.

Latest follow-up: the gear button now opens the node editor. All 476 frontend UI
unit checks and five real-browser team assembly checks passed, including
popup-free agent drop, protocol selection, keyboard activation, Cancel, and
saving the selected protocol in the workflow. The wider desktop/mobile run
passed 42 checks and found an overlapping-node fixture in the deployment test.
After separating those nodes, all four deployment browser checks passed
(`embers-current-browser-suite.log`, `embers-current-deploy-browser.log`). Browser tests use the production
UI with a test backend; this result does not certify chain execution.

The recovery scan was measured at 134 seconds for 92 runs. Embers now gives
registry enumeration its own configurable, finite 300-second observer deadline,
while ordinary reads retain their existing deadlines. Polling waits after scan
completion. All 199 backend unit tests passed, and the updated backend was loaded
at 21:07 UTC. The scan returned and recovery began processing runs without the former scan
timeouts. The previously interrupted browser run `01a08c9f-cf46-7d31-aed0-d317a362216c`
was observed at running revision 7 before recovery and completed revision 14
afterward. This confirms restart recovery of that run; the separate between-round
restart acceptance still needs its output/history assertions to pass. The supporting
logs and read-only probes are retained in the profile verification directory as
`embers-recovery-all-tests.log`, `embers-recovery-build.log`,
`embers-recovery-run-count.json`, `embers-gear-browser.log` and
`embers-current-ui-suite.log`.

The new limit rehearsal (`01a08d15-1d85-7151-a2d4-459f53d6cc6a`) reached
`completed` at revision 20, but its HTTP client had already timed out at 900
seconds during a validator stall. It is not counted as an integration-test pass.
The subsequent deployed suite passed the malformed-record, accepted-risk and
nested-container cases. Its limit case failed when Embers missed finalization of
an advancement checkpoint (`red-blue-deployed-recovery-build.log`: three passed,
one failed). Direct inspection found that checkpoint in finalized block 31994,
with no execution error, while the observer's deployment-status endpoint returned
`Expired`. The node resolver only scanned the recent validity window and forgot
older finalized inclusions. The node correction and single/batch regression test
are retained in `demo/research-desk/node-finalization-history.patch`. All 11 node
finalization tests passed, and the Chroma-enabled production build passed. Both
nodes were restarted with the existing chain and the corrected binary. The exact
checkpoint now returns `Finalized` with its original block hash.
Embers also now polls observer status while awaiting finalization notifications;
all 203 backend unit tests passed for that change, and the binary is loaded.
The previous limit timeout is retained in `red-blue-limit-current.log`. The fresh
limit acceptance passed in 527.75 seconds (`red-blue-limit-finality-fixed.log`),
including the three-round terminal response, outputs for each reviewer and local
calculator in every round, and distinct invocation IDs in the retained history.
Run: `01a08d4d-c0c5-7c83-9a38-aef6f63fb6ec`.
The earlier interrupted limit run `01a08d28-1bc9-7950-9eff-138fb90cace3`
was subsequently observed at `completed`, revision 20. Its original HTTP test
failed, so this recovery result does not replace the fresh acceptance run.

The planned node restart exposed a stack lifecycle race: the watchdog canceled
the external restart, then node startup tried to recreate inactive units whose
names were still registered. The stack is restored and the watchdog is armed.
Node cleanup now waits for both loaded units to unload, including inactive ones;
the shell lifecycle regression passes. This change preserves chain data and the
F1r3drive mount.


- 31 current local/real-reviewer checks passed in 19.29 seconds: 30 cover record validation, decimal arithmetic, unknown values, units, findings, responses, accepted risks and generated-source synchronization; one calls all three actual model reviewers and validates their returned records.
- 30 focused frontend workflow and graph-menu tests passed. Frontend and browser-test TypeScript checks and the production build passed.
- Deployed first-round convergence and revision cases passed earlier in this revision's development. The trace assertion now checks the per-invocation entry ID rather than the enclosing workflow execution ID. The corrected three-round limit acceptance passed on the repaired stack as recorded above.
- The full browser end-to-end test passed in 7.7 minutes on the refined storage build: it created all eight agents, selected structured-v1 through the dropdown, configured the bounded cycle and joins, wrapped a deployment container, deployed, ran the revision case, asserted two rounds and convergence, and verified the visible final response. Earlier attempts timed out or were interrupted while restoring storage; they are not counted as passes.
- Earlier full real-model rehearsals completed with incomplete-review outcomes because reviewer records violated the format. Whitespace handling and reviewer examples were corrected, including a misleading trailing period after END;. The focused real-model reviewer test now passes. The updated full-team rehearsal passed its first review without record errors and entered BlueResponder, but its send request failed with a validator RPC error: show_main_chain timed out after three attempts. Run: 01a08ce9-6ea2-73d1-bf43-65499f6d867e. The full real-model demo is therefore not certified; the earlier incomplete outcomes are not evidence of convergence.
- New publication, between-round restart, and three-domain real-model acceptance tests are present but have not yet passed on this revision. The registry scan timeout was corrected and the interrupted run resumed to completion as recorded above; the dedicated between-round restart test still needs to pass.

The storage interruption also exposed a retry bug: rebuilding a signed deployment with a newer valid-after block gave the retry a new ID, leaving both a completed encrypted file and an empty creation placeholder. The exact empty placeholder was removed after an observer simulation, and the completed ciphertext was verified unchanged. F1r3drive now prepares each queued operation once, preserves its signed payload across retries, recognizes prior inclusion and bounds finality-read RPCs. All 114 storage unit tests and the JAR build passed. The repaired mount loaded successfully and Embers returned online. Repair snapshots and the script are retained with the verification logs.

Current logs are under `embers-local-stack/run/profiles/research-desk/verification/`: `red-blue-local-and-reviewer.log`, `red-blue-deployed-final.log`, `red-blue-browser.log`, `red-blue-live-latest.log`, and `red-blue-final-stages.log`, and `red-blue-direct-rehearsal.log`. The failed current real-model rehearsal is in `red-blue-live-final.log`. Storage checks are in `/tmp/red-blue-drive-verification.log`. Focused frontend check logs are `/tmp/red-blue-ui-unit.log`, `/tmp/red-blue-ui-types.log`, `/tmp/red-blue-e2e-types.log` and `/tmp/red-blue-build.log`.

The current seeded team identity is recorded in the profile's `red-blue-demo.json`; use that file rather than a historical URI. Stack rehearsals should run sequentially because encrypted artifact writes can be slow under load.

## Historical baseline

The following evidence predates the bounded, task-aware revision. It records the earlier fixed-calculator demo and stack repairs; it does **not** certify the current loop or new calculators.

# Earlier demo verification — September 10, 2026

Runbook: [Create the red/blue team during the presentation](red-blue-demo-runbook.md).
Shared startup and Research Desk instructions: [Customer demo runbook](customer-demo-runbook.md).

## Implemented behavior

1. Deployment containers and workflow state scopes have separate authoring actions and backend behavior. Containers register their own Rholang contracts and dispatch member activities through their registered URIs. Nested containers are supported. The deployment target is the current stack.
2. The red/blue team contains six model agents and two local Rholang calculators, with 10 functional nodes and 25 edges. All eight agents can be selected with Shift-drag and placed inside a deployment container. The runbook includes their exact sources for live authoring.
3. Stable output keys replace redundant input-name aliases. ReviewCapacity computes staffing demand and utilization; EmergencyReviewPolicy computes independent-reviewer combinations, deficits, and deadline feasibility. DecisionWriter includes their actual evidence even if the model omits it.
4. Publication derives a valid handle from the team name, supplies the required suffix and local PDS defaults, uses the Embers form styling, and preserves explicitly overridden email values. Validation errors identify their fields; a completed publication uses Close.
5. The run view supports visible, scrollable decrypted responses and private agent history. New traces retain invocation identity and context for repeated or nested execution. Legacy outputs are read from retained encrypted observations; older inputs can be unavailable.

## Verification evidence

Logs are retained under `embers-local-stack/run/profiles/research-desk/verification/`.

| Check | Result | Log |
| --- | --- | --- |
| Embers backend unit suite | 196 passed | `all-backend-v3.log` |
| Additional observer-result visibility regression | 1 passed | `visibility-test.log` |
| Canonical deploy-finalization status decoding | 1 passed | `observer-status-v2.log` |
| Embers UI unit suite | 474 passed | `ui-tests-final.log` |
| Client SDK unit suite | 143 passed | `sdk-tests-final.log` |
| Frontend production build | Passed | `frontend-build-final.log` |
| Local calculator execution, source synchronization, and writer evidence composition | 7 passed | `calculators-final-v3.log` |
| Original red-team demo | Both scenarios passed | `three-demos.log` |
| Red/blue demo | Four scenarios passed, including nested containers | `three-demos.log`, `research-nested.log` |
| Research Desk | Choreography and live Chroma retrieval/archive/re-ask passed | `research-nested.log` |
| Live red/blue model rehearsal | Completed with both calculator evidence summaries | `redblue-live-final.log` |
| Eight-agent UI authoring, deployment container, deployment and query | Passed | `red-blue-browser-final.log` |
| Responsive run layouts | 8 passed | `responsive-runs.log` |
| Original saved-run decryption, response viewport, and all six agent outputs on desktop/mobile | 2 passed in 25 seconds | `saved-run-browser-repaired.log` |
| Existing deployment browser fixtures | 4 passed | `mock-team-deploy.log` |
| Graceful backend restart and SIGKILL recovery | 2 passed | `recovery-final.log` |
| Storage remount and backend recovery | Passed in 347 seconds | `storage-remount-recovery.log` |
| Local PDS publication, mention/reply execution, and unpublication | 8 passed | `pds-final.log` |
| F1r3drive unit suite | 113 passed | `f1r3drive/build/test-results/test/` |

The initial combined demo run exposed an observer visibility race and a stopped Chroma service. Those failures were resolved, and the affected Research Desk scenarios passed in `research-nested.log`. The initial saved-run checks also exposed storage metadata problems described below; retain those earlier failure logs for the incident history.

## Error and storage repair

The supplied `/var/tmp/error.log` reported an unknown `deploymentBindings` manifest field. The decoder now accepts the optional container bindings while preserving older manifests.

Historical checkpoints and observations were also hidden by inconsistent F1r3drive metadata. Its read endpoint had been pointed at validator port 40401, which rejects exploratory reads. The filesystem converted that failure into absence and could create an empty root. Duplicate directory records and orphaned bucket/file references hid existing encrypted data.

F1r3drive now distinguishes a successful empty read from a failed read, rejects ambiguous records, and refuses to recreate an existing on-chain directory whose parent reference is missing. The stack reads from the observer on 40411. Directory repairs were simulated, submitted with exact snapshot-matching patterns, and verified on-chain. Existing child references were combined and verified orphaned references reattached; encrypted file channels and contents were not rewritten. The repair snapshots and scripts are retained with the verification logs.

The mount is `research-desk/f1r3drive`; Java working files are in `research-desk/f1r3drive-tmp`, both under the persistent profile directory. A populated mount can take several minutes to reconstruct, so startup permits a configurable ten-minute wait.

The original [saved run](http://localhost:5173/runs/01a086a9-e3aa-7160-b00a-1a1570126d20) passed both final browser checks after remounting. Its final response and all six retained agent observations are readable. Final `stack.sh status` reported both nodes, the proposer, F1r3drive, Embers, PostgreSQL, Valkey, PLC, PDS, AppView, Ozone, and F1r3sky web UI up.

## Saved changes and presentation details

- Embers: `d931b02` fixes manifest decoding; `408aa79` implements deployment containers; `bc49380` verifies actual writer composition; `3e798e5` adds storage-remount acceptance.
- Embers frontend: `ad0c860` updates publication behavior; `83b7942` restores container authoring and the eight-agent demo; `b25fa21` retains calculator evidence; `15069bb` documents remount verification.
- F1r3drive: `f927deb` rejects failed and ambiguous reads; `8a1ec1e` protects orphaned directories.
- Local stack: `324ad00` persists Java working files; `df0faf9` allows populated mounts to finish startup.

The rehearsed backup team state is in `research-desk/red-blue-demo.json`, using that profile's default wallet. Its URI is `rho:id:a4or8iub6oququfdgcbyct673wrfq4r6r7aw8ftqtaws9rc6qgyrip`. The runbook describes creating a separate team live with the presenter wallet.

The local PDS is `http://localhost:2583`; F1r3sky is `http://localhost:19006`; Embers is `http://localhost:5173`. The dev network's PDS accounts and PLC identities were ephemeral and did not survive the reboot, although PostgreSQL retained AppView data. The dev network was resumed without resetting PostgreSQL, and `user1.test` / `password123` was recreated. Old browser sessions need a fresh sign-in, and previously published team accounts need republication.

An additional lookup of the earlier editable team ID `364a8381-f6bc-4150-b136-8d6e28852bfe` under the presenter wallet returned “agents team not found.” The saved run and its deployed contract remain available. This verification does not claim that the old editable team or its old PDS identity was recreated; use the eight-agent backup or the live-authoring runbook for the current demonstration.
