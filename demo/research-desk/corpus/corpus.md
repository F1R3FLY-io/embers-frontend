# Research Desk demo corpus

This is the human-readable source of the knowledge base seeded into the ChromaDB collection `embers-demo-docs` by [`../seed/seed-corpus.rho`](../seed/seed-corpus.rho). The two files must stay in sync: every entry below appears verbatim in the seed deploy.

Design constraints (from the platform, verified in code):

- Metadata values are limited to `String`, `Int`, and `Bool` (`chromadb_service.rs` rejects floats and sparse vectors).
- Each chunk is 250-450 characters so the assembled retrieval context stays comfortably inside one `rho:ai:gpt4` prompt.
- Chunks contain no double-quote characters so they can be embedded directly in Rholang string literals.
- Every chunk states facts a demo question can be answered from; the live demo questions are listed at the bottom.

## Entries

| id | topic | text |
|---|---|---|
| rholang-01 | rholang | Rholang is a concurrent programming language built on the rho-calculus. Programs are processes that communicate by sending and receiving messages over named channels. There is no shared mutable state: all coordination happens through message passing, which makes Rholang programs naturally parallel and safe to execute on a blockchain. |
| rholang-02 | rholang | In Rholang, a name is an unforgeable reference to a channel. The new construct creates fresh private names, and only processes that hold a name can send on it or receive from it. Capabilities in the Embers platform are built from this property: possessing a name is the authority to use it, and bundles can restrict a name to send-only or receive-only use. |
| node-01 | f1r3node | An F1r3fly shard consists of validator nodes and observer nodes. Validators execute deploys, run consensus, and hold the real external services such as the OpenAI integration and the ChromaDB vector store. Observers replicate state for reads and finalization watching but have their AI and vector services disabled by construction, so effectful calls only ever run on validators. |
| agents-01 | agent-abi | An Embers agent is a named, versioned Rholang program. The simple-v1 ABI is a contract main that receives an input and a return channel. The structured-v1 ABI receives an invocation record containing the input value and a context, and returns a record with an output field and a disposition field. Teams pin agents by immutable version, so a deployed team never changes behavior silently. |
| teams-01 | agent-teams | An agent team is a workflow definition: a directed multigraph of nodes such as inputs, activities, gateways, waits, approvals, and outputs. Execution is token based. A token carries the current value and its context between nodes, and transitions route tokens by disposition labels such as completed, failed, rejected, timedOut, and iterationLimit. |
| cycles-01 | cycles | Cycles between agents are first class in the Embers workflow model. The one safety rule is the progress boundary: every possible hot cycle must cross a wait node, a bounded transition, or a durable-yield transition. The editor and the backend both verify this with a hot-residual-graph check, and a team whose cycle lacks a progress boundary is rejected at deploy with the diagnostic cycle-without-progress. |
| cycles-02 | cycles | A bounded transition declares loop maxIterations. Its traversal counter lives in the token execution context, so concurrent runs and parallel branches never share a budget. When the bound is exhausted the transition does not fire again: instead the token disposition is rewritten to iterationLimit at the source node, and routing proceeds like any other trigger, for example escalating to a human approval gate. |
| approvals-01 | approvals | An approval node suspends a run until an authorized quorum approves or rejects. Every decision carries a globally unique decision identifier, which blocks replay. An approval with an empty approver list admits any actor holding command authority over the run, with quorum one this behaves as an owner-only gate. Approving with a null payload preserves the token value that was waiting at the gate. |
| security-01 | capabilities | A deployed team is published through the registry with an insertSigned operation and exported behind a write-only bundle. Callers can invoke the team but cannot intercept or deconstruct it. The run inspector link is a bearer read capability over owner-scrubbed metadata: prompts and model outputs never appear in the public run ledger, only content hashes. |
| security-02 | signing | Every mutation in Embers follows a two-phase protocol: the backend prepares an unsigned contract, the client signs it locally with the wallet key using secp256k1 over a blake2b digest, and the send phase submits the signature. The wallet key never leaves the client. A token binds the send to exactly one prepare exchange, and the only real authority is the wallet signature itself. |
| runtime-01 | replay | Calls to external services such as the gpt4 channel and the ChromaDB query channel are replay-cached non-deterministic operations. The first execution records the observed result on chain, and replay validation returns the recorded value instead of calling the service again. This is why validators can re-execute history deterministically even though the services themselves are not deterministic. |
| runtime-02 | durability | Between macrosteps the Embers run kernel checkpoints encrypted continuations to F1r3drive. A suspended run holds waits with deadlines, and the recovery scheduler resumes due timers through a self-signed timerFired path. The public run state exposes status, revision, waits, and event hashes, while prompt and output contents stay sealed in encrypted artifacts. |
| rag-01 | chromadb | The ChromaDB integration gives Rholang programs vector search as chain system processes. Contracts can create collections, upsert documents with metadata, and query by similarity. Embeddings are computed inside the node by a local sentence transformer model, all-MiniLM-L6-v2, and the query channel returns the top ten nearest documents, most relevant first. |

## Provenance

The 13 entries above are the reviewed corpus: every document the seed deploy writes. At runtime one more source exists — the team's Archivist agent files human-approved answers from the escalation gate as additional documents in the same collection, with id `qa: <question>`, text `Q: <question>` newline `A: <answer>`, and metadata `source: human-approval`, `topic: qa`. Those documents are runtime state, not part of this file, and the two-way sync rule above does not extend to them.

Three properties keep the runtime documents trustworthy:

- Only gate-approved human answers can enter this way. The accept path bypasses the Archivist entirely, and a preserved refusal is recognized and skipped, so accepted model output cannot re-enter retrieval.
- Re-answering a question overwrites its document (same id), so the collection holds one canonical human answer per question.
- Reseeding with `seed-corpus.rho` upserts the 13 reviewed ids and leaves the `qa: ` documents in place; wiping them requires resetting the chain (or deleting them by id through `rho:chroma:collection:entries:delete`).

## Demo questions

Happy path (answerable from the corpus):

- What is the progress boundary rule for cycles? (cycles-01, cycles-02)
- How does the two-phase signing protocol keep wallet keys private? (security-02)
- Why can validators replay LLM calls deterministically? (runtime-01)
- What happens when a bounded loop exhausts its iterations? (cycles-02, approvals-01)

Loop-exhaustion trap (deliberately unanswerable from BOTH the corpus and model pretraining — a fictional platform internal, so the Researcher must admit the gap and the Critic fails every draft until the bound exhausts):

- What is the exact rotation schedule of the Zephyr-9 attestation committee?

A general question the model knows from pretraining (for example, which consensus algorithm Bitcoin uses) is NOT a reliable trap: under revise pressure the model produces a confident answer from outside knowledge and the Critic accepts it.
