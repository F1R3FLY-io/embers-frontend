# Demo node GC backport — September 14, 2026

The local branch `feature/embers-demo-gc` contains one GC-only commit:
`628b6bb14ad16a4ad91fc9d91bc3a736cec8aa6d`. Its parent is the existing demo pin
`43692191ce388d3068bcd3ab722fd1ca4c0beed7`.

The backport takes the finalized-floor retention bound, incremental sweep,
pending retries, and common-ancestor traversal from upstream
`c0c8d050fc14376b27b7f2d4e9b99ce394ae1d04`, plus GC scheduling from
`feature/cost-accounted-rho` frozen at
`9e58cf211885b2cdb319e030efa2af0491d71471`. Adaptations use the old floor API
and test metadata/deploy-index layout. Cargo manifests and lockfile, toolchain,
protobufs, deployed protocol, and chain database format are unchanged.

The existing Chroma import, finalized-status history, and Unicode patches remain
outside this commit. A fresh checkout still needs all three patches listed in
the [customer runbook](customer-demo-runbook.md). `node-gc-history.patch` now
contains this exact upstream backport, replacing the earlier unapplied proposal.
Apply either the commit or that GC patch, never both.

## Verification

- 20 GC unit tests passed, covering incremental ranges, pending bookkeeping,
  floor/depth retention, forks, strict ancestry, and differential traversal.
- The Unicode character-length/slicing regression passed.
- All 11 deploy-finalization status regressions passed.
- `cargo build --release -p node --features rholang/chromadb --locked` passed.
- Both nodes resumed the existing chain with the new binary. The first normal
  scheduled GC pass completed in 20.07 seconds on the validator and 20.90 seconds
  on the observer. This was the initial sweep over roughly 53,000 historical
  blocks. Metrics endpoints responded after the pass; this is not a measurement
  of worst-case API latency during collection and is not a load-test result.

The built node SHA-256 is
`5d46e1d2fea1c0390b56b1bfa36dbfd2d07042fa4e2433b048ab20d324d60817`.
Logs and measurements are under
`embers-local-stack/run/profiles/research-desk/verification/demo-gc-*`.
The first live red/blue query, `01a0a169-73bd-7fa3-87a9-f338683a7c10`, completed all three bounded rounds and returned its final response. It stopped with **incomplete review; human review required** because a reviewer omitted prior finding E4 and produced an invalid/duplicate finding; the capacity check remained unknown. This proves deployed execution and response delivery, but is **not** a clean semantic acceptance pass for the red/blue demo. The exact response is recorded in `demo-gc-live-red-blue.log`. Subsequent agent validation fixes and the follow-up rehearsal are tracked in the [red/blue verification report](red-blue-demo-verification.md); they do not change the node backport.

## Rollback

The pre-backport executable is preserved at
`embers-local-stack/run/profiles/research-desk/verification/node-before-upstream-gc-backport`.
To roll back, set `F1R3NODE_BIN` in the local `secrets.env` to that absolute path,
pause `embers-local-stack-1f3ff321c736-node-watchdog.timer`, restart the validator
and read-node services, and rearm the watchdog using `./stack.sh nodes`.
Stop both the watchdog timer and its service before the restart; `./stack.sh nodes` rearms the timer after both nodes are healthy. Both executables use the same protocol and data format. Preserve the profile,
wallets, cipher key, and existing chain directories; no reset is needed.
