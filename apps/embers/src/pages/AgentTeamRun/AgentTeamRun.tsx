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
import { useParams } from "react-router-dom";

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

const interactiveCommands = [
  RunCommandKind.Signal,
  RunCommandKind.Event,
  RunCommandKind.Approve,
  RunCommandKind.Reject,
  RunCommandKind.Retry,
  RunCommandKind.Cancel,
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

export default function AgentTeamRun() {
  const { runId = "" } = useParams();
  const wallet = useWalletState();
  const [commandType, setCommandType] = useState<RunCommandKindType>(
    RunCommandKind.Signal,
  );
  const [waitId, setWaitId] = useState("");
  const [name, setName] = useState("");
  const [payload, setPayload] = useState("null");
  const [reason, setReason] = useState("Cancelled by the run owner");
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
      const needsWait = commandType !== RunCommandKind.Cancel;
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
        case RunCommandKind.Migrate:
        case RunCommandKind.TimerFired:
          throw new Error("This command is not exposed by the run inspector.");
      }

      return wallet.embers.agentsTeams.command(runId, request);
    },
    onSuccess: async () => {
      await run.refetch();
    },
  });

  const needsWait = commandType !== RunCommandKind.Cancel;
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
                    <a href="/login">Sign in</a> with the run owner or a
                    delegated approver wallet to resume this run.
                  </p>
                ) : (
                  <form
                    className={styles["command-form"]}
                    onSubmit={(event) => {
                      event.preventDefault();
                      command.reset();
                      command.mutate();
                    }}
                  >
                    <label>
                      Command
                      <select
                        value={commandType}
                        onChange={(event) => {
                          setCommandType(
                            event.currentTarget.value as RunCommandKindType,
                          );
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
                      <p className={styles.success} role="status">
                        Command applied. The ledger has been refreshed.
                      </p>
                    ) : null}
                  </form>
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
              excluded from the public ledger.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
