import type {
  AgentTraceEntry,
  TraceSession,
} from "@f1r3fly-io/embers-client-sdk";

import { ApiError } from "@f1r3fly-io/embers-client-sdk";
import { useEffect, useState } from "react";

import { Button } from "@/lib/components/Button";
import { useWalletState } from "@/lib/providers/wallet/useApi";

import styles from "./AgentTeamRun.module.scss";
import { RunResponse } from "./RunResponse";

export function AgentActivity({
  active,
  runId,
}: {
  active: boolean;
  runId: string;
}) {
  const wallet = useWalletState();
  const [session, setSession] = useState<TraceSession | null>(null);
  const [entries, setEntries] = useState<AgentTraceEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!session || !wallet.ready) {
      return;
    }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expire = setTimeout(
      () => {
        setEntries([]);
        setSession(null);
        setError("History authorization expired. Unlock it again to continue.");
      },
      Math.max(0, session.expiresAt - Date.now()),
    );
    async function update() {
      if (!wallet.ready || !session) {
        return;
      }
      try {
        const values: AgentTraceEntry[] = [];
        let offset: number | null = 0;
        let latestNotice: string | null = null;
        do {
          // Each page depends on the cursor returned by the previous page.
          // eslint-disable-next-line no-await-in-loop
          const page = await wallet.embers.agentsTeams.readTrace(
            runId,
            session.accessToken,
            offset,
            { signal: controller.signal },
          );
          values.push(...page.entries);
          latestNotice = page.legacyNotice;
          offset = page.nextOffset;
        } while (offset !== null && !controller.signal.aborted);
        if (!controller.signal.aborted) {
          setEntries(values);
          setNotice(latestNotice);
          setError("");
        }
      } catch (failure) {
        if (controller.signal.aborted) {
          return;
        }
        if (
          failure instanceof ApiError &&
          [403, 410].includes(failure.status)
        ) {
          setEntries([]);
          setSession(null);
        }
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not load agent activity.",
        );
      }
      if (active && !controller.signal.aborted) {
        timer = setTimeout(() => void update(), 3000);
      }
    }
    void update();
    return () => {
      controller.abort();
      clearTimeout(timer);
      clearTimeout(expire);
    };
  }, [session, wallet, runId, active, refresh]);

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const rows = entries.filter(
    (entry) => entry.executionId === "root" || !byId.has(entry.executionId),
  );
  const renderEntry = (entry: AgentTraceEntry, ancestors: Set<string>) => {
    if (ancestors.has(entry.id)) {
      return null;
    }
    const path = new Set(ancestors).add(entry.id);
    const children = entries.filter((child) => child.executionId === entry.id);
    const iterations = Object.values(entry.context?.iterations ?? {});
    return (
      <li key={entry.id}>
        <details>
          <summary>
            <strong>{entry.agentName}</strong> — {entry.status}
            {iterations.length > 0 &&
              ` · iteration ${Math.max(...iterations) + 1}`}
            {(entry.attempt ?? 1) > 1 && ` · attempt ${entry.attempt}`}
          </summary>
          {entry.outputAvailable ? (
            <RunResponse
              revealed
              autoFocus={false}
              title={`${entry.agentName} output`}
              value={entry.output}
            />
          ) : (
            <p>
              {entry.status === "running"
                ? "This agent is still running."
                : "No output was retained for this execution."}
            </p>
          )}
          <details>
            <summary>Input</summary>
            {entry.inputAvailable ? (
              <RunResponse
                revealed
                autoFocus={false}
                title={`${entry.agentName} input`}
                value={entry.input}
              />
            ) : (
              <p>This older execution did not retain its input.</p>
            )}
          </details>
          <details>
            <summary>Execution information</summary>
            <dl className={styles.metadata}>
              <dt>Team</dt>
              <dd>{entry.teamUri}</dd>
              <dt>Node</dt>
              <dd>{entry.nodeId}</dd>
              <dt>Execution</dt>
              <dd>{entry.id}</dd>
              {entry.observedAt && (
                <>
                  <dt>Completed</dt>
                  <dd>{new Date(entry.observedAt).toLocaleString()}</dd>
                </>
              )}
            </dl>
          </details>
        </details>
        {children.length > 0 && (
          <details open>
            <summary>{entry.agentName} · nested agents</summary>
            <ol>{children.map((child) => renderEntry(child, path))}</ol>
          </details>
        )}
      </li>
    );
  };

  return (
    <section aria-label="Agent activity" className={styles.section}>
      <h2>Agent activity</h2>
      <p>
        Inspect each agent’s response as the team works. Inputs and outputs are
        visible only after authorizing with the run owner’s wallet.
      </p>
      {!session && (
        <Button
          disabled={!wallet.ready || pending}
          type="secondary"
          onClick={async () => {
            if (!wallet.ready) {
              return;
            }
            setPending(true);
            setError("");
            try {
              setSession(await wallet.embers.agentsTeams.unlockTrace(runId));
            } catch (failure) {
              setError(
                failure instanceof Error
                  ? failure.message
                  : "Could not unlock agent history.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Authorizing history…" : "Unlock agent history"}
        </Button>
      )}
      {!wallet.ready && (
        <p>Sign in with the run owner’s wallet to inspect the agents.</p>
      )}
      {error && <p role="alert">{error}</p>}
      {session && error && (
        <Button
          type="secondary"
          onClick={() => setRefresh((value) => value + 1)}
        >
          Retry history
        </Button>
      )}
      {session && entries.length === 0 && !error && (
        <p>No agent executions are available yet.</p>
      )}
      {notice && <p>{notice}</p>}
      <ol className={styles.activity}>
        {rows.map((entry) => renderEntry(entry, new Set()))}
      </ol>
    </section>
  );
}
