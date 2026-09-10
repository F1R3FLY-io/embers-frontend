# Demo verification — September 10, 2026

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
