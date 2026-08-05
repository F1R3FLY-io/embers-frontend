import type {
  RunCommandKind as RunCommandKindType,
  RunCommandReq,
  RunState,
} from "@f1r3fly-io/embers-client-sdk";

import {
  RunCommandKind,
  RunStateFromJSON,
} from "@f1r3fly-io/embers-client-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useWalletState } from "@/lib/providers/wallet/useApi";

import styles from "./AgentTeamRun.module.scss";

async function getRun(runId: string, signal: AbortSignal): Promise<RunState> {
  const response = await fetch(
    `${window.API_URL.replace(/\/$/, "")}/api/ai-agents-teams/runs/${encodeURIComponent(runId)}`,
    { signal },
  );

  if (response.status === 404) {
    throw new Error(
      "This run does not exist or its capability link is invalid.",
    );
  }
  if (!response.ok) {
    throw new Error(`The run ledger returned HTTP ${response.status}.`);
  }

  return RunStateFromJSON(await response.json());
}

// Ordered by how routinely an operator reaches for them: the resume commands
// first, then cancellation, then the two deliberate operator tools -- the
// timer escape hatch (the scheduler normally fires timers itself) and the
// definition migration (a rebind that deserves its own confirmation step).
const interactiveCommands = [
  RunCommandKind.Signal,
  RunCommandKind.Event,
  RunCommandKind.Approve,
  RunCommandKind.Reject,
  RunCommandKind.Retry,
  RunCommandKind.Cancel,
  RunCommandKind.TimerFired,
  RunCommandKind.Migrate,
] as const;

function commandName(command: RunCommandKindType) {
  return command.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function parsePayload(source: string): unknown {
  if (source.trim() === "") {
    return null;
  }
  try {
    return JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error(
      `Payload is not valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`,
    );
  }
}

function eventName(eventType: string) {
  return eventType
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (first) => first.toUpperCase());
}

function parseStatePatch(source: string): unknown[] {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error(
      `State patch is not valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`,
    );
  }
  if (!Array.isArray(value)) {
    throw new Error(
      'State patch must be a JSON array of patch operations, e.g. [{"operation":"set","path":["cursor"],"value":0}].',
    );
  }
  return value;
}

function parseDeadline(source: string): Date {
  const parsed = new Date(source.trim());
  if (source.trim() === "" || Number.isNaN(parsed.getTime())) {
    throw new Error(
      "Expected deadline must be a valid timestamp; keep the value prefilled from the run's next deadline.",
    );
  }
  return parsed;
}

export default function AgentTeamRun() {
  const { runId = "" } = useParams();
  const location = useLocation();
  const wallet = useWalletState();
  const confirm = useConfirm();
  const [commandType, setCommandType] = useState<RunCommandKindType>(
    RunCommandKind.Signal,
  );
  const [waitId, setWaitId] = useState("");
  const [name, setName] = useState("");
  const [payload, setPayload] = useState("null");
  const [reason, setReason] = useState("Cancelled by the run owner");
  const [expectedDeadline, setExpectedDeadline] = useState("");
  const [fromDefinitionHash, setFromDefinitionHash] = useState("");
  const [toDefinitionHash, setToDefinitionHash] = useState("");
  const [targetTeamUri, setTargetTeamUri] = useState("");
  const [statePatch, setStatePatch] = useState("[]");
  const run = useQuery({
    enabled: runId.length > 0,
    queryFn: async ({ signal }) => getRun(runId, signal),
    queryKey: ["agent-team-run", runId],
    refetchInterval: ({ state }) =>
      ["resuming", "running", "suspended"].includes(state.data?.status ?? "")
        ? 3_000
        : false,
  });
  const command = useMutation({
    mutationFn: async () => {
      if (!wallet.ready) {
        throw new Error("Sign in with the command-authority wallet first.");
      }
      if (!run.data) {
        throw new Error("The run state is unavailable.");
      }
      const needsWait =
        commandType !== RunCommandKind.Cancel &&
        commandType !== RunCommandKind.Migrate;
      if (needsWait && waitId === "") {
        throw new Error("Select the exact wait this command should resume.");
      }

      const base = {
        expectedRevision: run.data.revision,
        type: commandType,
      };
      let request: RunCommandReq;
      switch (commandType) {
        case RunCommandKind.Signal:
        case RunCommandKind.Event:
          if (name.trim() === "") {
            throw new Error("Signal and event commands require a name.");
          }
          request = {
            ...base,
            name: name.trim(),
            payload: parsePayload(payload),
            waitId,
          };
          break;
        case RunCommandKind.Approve:
          request = {
            ...base,
            decisionId: crypto.randomUUID(),
            payload: parsePayload(payload),
            waitId,
          };
          break;
        case RunCommandKind.Reject:
          request = { ...base, payload: parsePayload(payload), waitId };
          break;
        case RunCommandKind.Retry:
          request = { ...base, waitId };
          break;
        case RunCommandKind.Cancel:
          if (reason.trim() === "") {
            throw new Error("Cancellation requires an audit reason.");
          }
          request = { ...base, reason: reason.trim() };
          break;
        case RunCommandKind.TimerFired:
          // The kernel only accepts a fire that names the wait's recorded
          // deadline exactly and is not early, so a wrong manual value is a
          // clean rejection rather than a premature resume.
          request = {
            ...base,
            expectedDeadline: parseDeadline(expectedDeadline),
            waitId,
          };
          break;
        case RunCommandKind.Migrate:
          if (
            fromDefinitionHash.trim() === "" ||
            toDefinitionHash.trim() === "" ||
            targetTeamUri.trim() === ""
          ) {
            throw new Error(
              "Migration requires the current definition hash, the target definition hash, and the target team URI.",
            );
          }
          request = {
            ...base,
            fromDefinitionHash: fromDefinitionHash.trim(),
            statePatch: parseStatePatch(statePatch),
            targetTeamUri: targetTeamUri.trim(),
            toDefinitionHash: toDefinitionHash.trim(),
          };
          break;
      }

      return wallet.embers.agentsTeams.command(runId, request);
    },
    onSuccess: async () => {
      await run.refetch();
    },
  });
  const reveal = useMutation({
    mutationFn: async () => {
      if (!wallet.ready) {
        throw new Error("Sign in with the wallet that started this run first.");
      }
      return wallet.embers.agentsTeams.revealOutput(runId);
    },
    onSuccess: async () => {
      // The signed claim appends an outputRevealed event to the public
      // timeline; refetch so the trail below shows it.
      await run.refetch();
    },
  });

  const needsWait =
    commandType !== RunCommandKind.Cancel &&
    commandType !== RunCommandKind.Migrate;
  const needsName = [RunCommandKind.Event, RunCommandKind.Signal].includes(
    commandType as "event" | "signal",
  );
  const needsPayload = [
    RunCommandKind.Approve,
    RunCommandKind.Event,
    RunCommandKind.Reject,
    RunCommandKind.Signal,
  ].includes(commandType as "approve" | "event" | "reject" | "signal");
  const commandable = ["running", "suspended"].includes(run.data?.status ?? "");

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <a className={styles.home} href="/">
          Embers
        </a>
        <p className={styles.eyebrow}>Agent Team run</p>

        {run.isPending ? <p>Reading the durable run ledger…</p> : null}
        {run.error ? (
          <div className={styles.error} role="alert">
            <h1>Run unavailable</h1>
            <p>{run.error.message}</p>
          </div>
        ) : null}

        {run.data ? (
          <>
            <div className={styles["title-row"]}>
              <h1>Execution {run.data.status}</h1>
              <span className={styles.status} data-status={run.data.status}>
                {run.data.status}
              </span>
            </div>

            <dl className={styles.metadata}>
              <div>
                <dt>Run capability</dt>
                <dd>{run.data.runId}</dd>
              </div>
              <div>
                <dt>Agent Team</dt>
                <dd>{String(run.data.agentsTeam)}</dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>{run.data.createdAt.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Revision</dt>
                <dd>{run.data.revision.toString()}</dd>
              </div>
              {run.data.definitionHash ? (
                <div>
                  <dt>Definition</dt>
                  <dd>{run.data.definitionHash}</dd>
                </div>
              ) : null}
              {run.data.dueAt ? (
                <div>
                  <dt>Next deadline</dt>
                  <dd>{run.data.dueAt.toLocaleString()}</dd>
                </div>
              ) : null}
            </dl>

            {run.data.waitIds.length > 0 ? (
              <section className={styles.section}>
                <h2>Active waits</h2>
                <ul className={styles.waits}>
                  {run.data.waitIds.map((currentWaitId) => (
                    <li key={currentWaitId}>
                      <code>{currentWaitId}</code>
                    </li>
                  ))}
                </ul>
                {run.data.approvalAuthorityGrants.length > 0 ? (
                  <details>
                    <summary>Delegated approval grants</summary>
                    <ul className={styles.waits}>
                      {run.data.approvalAuthorityGrants.map((grant) => (
                        <li key={grant}>
                          <code>{grant}</code>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </section>
            ) : null}

            {commandable ? (
              <section className={styles.section}>
                <h2>Send an authenticated command</h2>
                {!wallet.ready ? (
                  <p className={styles.notice}>
                    <Link state={{ from: location }} to="/login">
                      Sign in
                    </Link>{" "}
                    with the run owner or a delegated approver wallet to
                    resume this run.
                  </p>
                ) : (
                  <form
                    className={styles["command-form"]}
                    onSubmit={(event) => {
                      event.preventDefault();
                      command.reset();
                      if (commandType === RunCommandKind.Migrate) {
                        // A migration rebinds the run to another definition;
                        // it deserves an explicit second look before signing.
                        void (async () => {
                          if (
                            await confirm({
                              message: `Rebind this run from definition ${fromDefinitionHash.trim() || "(unset)"} to ${toDefinitionHash.trim() || "(unset)"} on team ${targetTeamUri.trim() || "(unset)"}. The kernel verifies the current hash and applies the state patch atomically; a mismatch rejects the command without changing the run.`,
                              title: "Confirm migration",
                            })
                          ) {
                            command.mutate();
                          }
                        })();
                      } else {
                        command.mutate();
                      }
                    }}
                  >
                    <label>
                      Command
                      <select
                        value={commandType}
                        onChange={(event) => {
                          const nextType = event.currentTarget
                            .value as RunCommandKindType;
                          setCommandType(nextType);
                          // Prefill from the run so the operator edits a
                          // correct value instead of typing one from scratch;
                          // an already-edited field is never overwritten.
                          if (nextType === RunCommandKind.TimerFired) {
                            setExpectedDeadline((current) =>
                              current === ""
                                ? (run.data.dueAt?.toISOString() ?? "")
                                : current,
                            );
                          }
                          if (nextType === RunCommandKind.Migrate) {
                            setFromDefinitionHash((current) =>
                              current === ""
                                ? (run.data.definitionHash ?? "")
                                : current,
                            );
                          }
                        }}
                      >
                        {interactiveCommands.map((candidate) => (
                          <option key={candidate} value={candidate}>
                            {commandName(candidate)}
                          </option>
                        ))}
                      </select>
                    </label>

                    {needsWait ? (
                      <label>
                        Exact wait
                        <select
                          required
                          value={waitId}
                          onChange={(event) => {
                            setWaitId(event.currentTarget.value);
                          }}
                        >
                          <option value="">Select a wait…</option>
                          {run.data.waitIds.map((currentWaitId) => (
                            <option key={currentWaitId} value={currentWaitId}>
                              {currentWaitId}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {needsName ? (
                      <label>
                        Signal or event name
                        <input
                          required
                          value={name}
                          onChange={(event) => {
                            setName(event.currentTarget.value);
                          }}
                        />
                      </label>
                    ) : null}

                    {needsPayload ? (
                      <label>
                        JSON payload
                        <textarea
                          rows={5}
                          spellCheck={false}
                          value={payload}
                          onChange={(event) => {
                            setPayload(event.currentTarget.value);
                          }}
                        />
                      </label>
                    ) : null}

                    {commandType === RunCommandKind.Cancel ? (
                      <label>
                        Audit reason
                        <textarea
                          required
                          rows={3}
                          value={reason}
                          onChange={(event) => {
                            setReason(event.currentTarget.value);
                          }}
                        />
                      </label>
                    ) : null}

                    {commandType === RunCommandKind.TimerFired ? (
                      <>
                        <label>
                          Expected deadline
                          <input
                            required
                            value={expectedDeadline}
                            onChange={(event) => {
                              setExpectedDeadline(event.currentTarget.value);
                            }}
                          />
                        </label>
                        <p className={styles.notice}>
                          The scheduler fires due timers automatically; manual
                          firing exists for degraded-scheduler operation. The
                          value must equal the selected wait&apos;s recorded
                          deadline exactly -- the kernel rejects mismatched or
                          early fires.
                        </p>
                      </>
                    ) : null}

                    {commandType === RunCommandKind.Migrate ? (
                      <>
                        <label>
                          From definition hash
                          <input
                            required
                            value={fromDefinitionHash}
                            onChange={(event) => {
                              setFromDefinitionHash(event.currentTarget.value);
                            }}
                          />
                        </label>
                        <label>
                          To definition hash
                          <input
                            required
                            value={toDefinitionHash}
                            onChange={(event) => {
                              setToDefinitionHash(event.currentTarget.value);
                            }}
                          />
                        </label>
                        <label>
                          Target team URI
                          <input
                            required
                            value={targetTeamUri}
                            onChange={(event) => {
                              setTargetTeamUri(event.currentTarget.value);
                            }}
                          />
                        </label>
                        <label>
                          State patch (JSON array)
                          <textarea
                            rows={5}
                            spellCheck={false}
                            value={statePatch}
                            onChange={(event) => {
                              setStatePatch(event.currentTarget.value);
                            }}
                          />
                        </label>
                      </>
                    ) : null}

                    <button disabled={command.isPending} type="submit">
                      {command.isPending
                        ? "Signing and applying…"
                        : "Sign and send"}
                    </button>
                    {command.error ? (
                      <p className={styles.error} role="alert">
                        {command.error.message}
                      </p>
                    ) : null}
                    {command.isSuccess ? (
                      <>
                        <p className={styles.success} role="status">
                          Command applied. The ledger has been refreshed.
                        </p>
                        <section className={styles["command-result"]}>
                          <h3>Command result (visible only to you)</h3>
                          <p>
                            This value returned over your authenticated
                            channel; the public ledger records only hashes.
                          </p>
                          <pre data-testid="command-result-json">
                            {JSON.stringify(
                              command.data.sendResponse,
                              null,
                              2,
                            )}
                          </pre>
                        </section>
                      </>
                    ) : null}
                  </form>
                )}
              </section>
            ) : null}

            {run.data.status === "completed" ? (
              <section className={styles.section}>
                <h2>Reveal the full response</h2>
                {!wallet.ready ? (
                  <p className={styles.notice}>
                    <Link state={{ from: location }} to="/login">
                      Sign in
                    </Link>{" "}
                    with the wallet that started this run to reveal its full
                    response.
                  </p>
                ) : (
                  <>
                    <p className={styles.notice}>
                      The output value is sealed in an encrypted artifact whose
                      hashes are committed on this record; only the run
                      owner&apos;s signature can release it, and the public
                      ledger records the reveal without the value.
                    </p>
                    <button
                      disabled={reveal.isPending}
                      type="button"
                      onClick={() => {
                        reveal.reset();
                        reveal.mutate();
                      }}
                    >
                      {reveal.isPending
                        ? "Signing and revealing…"
                        : "Reveal full response"}
                    </button>
                    {reveal.error ? (
                      <p className={styles.error} role="alert">
                        {reveal.error.message}
                      </p>
                    ) : null}
                    {reveal.isSuccess ? (
                      <section className={styles["command-result"]}>
                        <h3>Full response (visible only to you)</h3>
                        <p>
                          This value returned over your authenticated channel;
                          the public ledger records only the reveal event and
                          hashes.
                        </p>
                        <pre data-testid="reveal-result-json">
                          {JSON.stringify(reveal.data.sendResponse, null, 2)}
                        </pre>
                      </section>
                    ) : null}
                  </>
                )}
              </section>
            ) : null}

            <section className={styles.section}>
              <h2>Durable events</h2>
              <ol className={styles.timeline}>
                {run.data.events.map((event) => (
                  <li key={`${event.sequence.toString()}-${event.eventType}`}>
                    <span>{event.sequence.toString()}</span>
                    <strong>{eventName(event.eventType)}</strong>
                  </li>
                ))}
              </ol>
            </section>

            <p className={styles.privacy}>
              This capability-scoped view contains execution metadata only.
              Inputs, outputs, credentials, and artifacts are deliberately
              excluded from the public ledger; a completed run&apos;s output is
              released only through the owner-signed reveal, over the
              signer&apos;s own channel.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
