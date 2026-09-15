/**
 * A stand-in agents backend, reached through the SDK's own transport seam.
 *
 * WHY NOT MSW. MSW was the plan's choice here, on the reasoning that the app
 * constructs its SDK inside `WalletProvider` and so offers nothing to inject
 * through. That is true of the running app but not of these tests: a hook test
 * supplies the wallet context itself, so it can build the `EmbersApiSdk` and
 * hand it a `fetchApi` exactly as the SDK's own suites do. Injecting is then
 * strictly better -- scoped to one SDK rather than patching the process, no
 * server lifecycle, and no dependency whose ESM-only transitive package the
 * CommonJS test runtime cannot load. The msw dependency was removed rather
 * than left installed and unused.
 *
 * The four endpoints `queries.ts` reaches with a bare `fetch` (published
 * state, referencing teams, unpublish, run state) are not covered by this seam
 * and are stubbed on `globalThis.fetch` by the suites that exercise them, which
 * is the pattern those suites already use.
 *
 * The one behavior this fixture exists to make testable is observer lag: the
 * list endpoint can answer 200 with a record that is already written but not
 * yet visible. `queries.ts` handles that by polling until the record appears,
 * and only a server that is deliberately stale for a chosen number of reads
 * can prove the polling works.
 */

export interface AgentRecord {
  id: string;
  name: string;
  version: string;
}

export interface FakeBackend {
  /** Request labels, in the order they arrived. */
  readonly calls: string[];
  /** Fail the next send with this status and description. */
  failSend?: { description: string; status: number };
  fetchApi: (input: unknown, init?: RequestInit) => Promise<Response>;
  /**
   * The base64 signature from the most recent send.
   *
   * The SDK derives the deploy id it waits on from its OWN signature rather
   * than from anything the server returns, so emitting a matching finalization
   * event is only possible by reading the signature back off the request.
   */
  lastSignature: string;
  records: AgentRecord[];
  /** How many further list reads answer with the pre-mutation snapshot. */
  staleReads: number;
}

const NEW_AGENT: AgentRecord = {
  id: "agent-new",
  name: "Researcher",
  version: "version-1",
};

export function fakeAgentsBackend(initial: AgentRecord[] = []): FakeBackend {
  const calls: string[] = [];
  let records = [...initial];
  let snapshot = [...initial];

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
      status,
    });

  const list = () => ({
    agents: records.map((record) => ({
      created_at: "1",
      id: record.id,
      name: record.name,
      version: record.version,
    })),
  });

  const staleList = () => ({
    agents: snapshot.map((record) => ({
      created_at: "1",
      id: record.id,
      name: record.name,
      version: record.version,
    })),
  });

  const backend: FakeBackend = {
    calls,
    // Every branch answers from memory, so nothing is awaited. The promise
    // is the FetchAPI contract that the generated client calls through, not a
    // sign that anything here is slow.
    // eslint-disable-next-line @typescript-eslint/require-await
    async fetchApi(input, init) {
      const path = new URL(String(input)).pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      const body =
        typeof init?.body === "string"
          ? (JSON.parse(init.body) as Record<string, unknown>)
          : undefined;

      if (method === "GET") {
        calls.push("list");
        if (backend.staleReads > 0) {
          backend.staleReads -= 1;
          // A successful read of an out-of-date view: the exact shape of the
          // failure that made a newly created agent invisible until a refresh.
          return json(staleList());
        }
        return json(list());
      }

      if (path.endsWith("/create/prepare")) {
        calls.push("create/prepare");
        return json({
          response: { contract: "AQID", id: NEW_AGENT.id },
          token: "token",
        });
      }

      if (path.endsWith("/create/send")) {
        calls.push("create/send");
        backend.lastSignature =
          (body?.request as { sig?: string } | undefined)?.sig ?? "";
        if (backend.failSend !== undefined) {
          return json(
            { description: backend.failSend.description },
            backend.failSend.status,
          );
        }
        records = [...records, NEW_AGENT];
        return json({ deploy_id: "deploy-create" });
      }

      if (path.endsWith("/delete/prepare")) {
        calls.push("delete/prepare");
        return json({ contract: "AQID" });
      }

      if (path.endsWith("/delete/send")) {
        calls.push("delete/send");
        backend.lastSignature = (body?.sig as string | undefined) ?? "";
        if (backend.failSend !== undefined) {
          return json(
            { description: backend.failSend.description },
            backend.failSend.status,
          );
        }
        const id = path.split("/").at(-3);
        records = records.filter((record) => record.id !== id);
        return json({ deploy_id: "deploy-delete" });
      }

      throw new Error(`unscripted request: ${method} ${path}`);
    },
    lastSignature: "",
    get records() {
      return records;
    },
    set records(value: AgentRecord[]) {
      records = value;
      snapshot = [...value];
    },
    staleReads: 0,
  };

  return backend;
}

/** The deploy id the SDK subscribed for, given the signature it sent. */
export function deployIdFromSignature(signatureBase64: string): string {
  const bytes = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
