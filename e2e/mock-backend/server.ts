import type { AddressInfo } from "node:net";
import type { WebSocket } from "ws";

import { createServer } from "node:http";
import { WebSocketServer } from "ws";

import type { HttpResult, RouteContext } from "./wire";

import { agentRoutes } from "./routes/agents";
import { grantRoutes } from "./routes/grants";
import { teamRoutes } from "./routes/teams";
import { Store } from "./store";
import { deployIdFrom, json } from "./wire";

/**
 * A stand-in Embers backend, spoken to by the real app over real HTTP.
 *
 * It answers the subset of the API the browser actually uses, in the wire
 * shapes the generated client expects (snake_case, string-encoded integers,
 * base64 bytes). Anything it does not recognise fails loudly rather than
 * returning an empty success, because a silently-answered request is how an
 * end-to-end test passes while exercising nothing.
 *
 * The finalization stream is the interesting half. Every mutation is
 * prepare -> sign -> send, and the client then waits on a WebSocket for the
 * observer to confirm the deploy. The deploy id it waits for is derived from
 * the client's OWN signature, so this server reads the signature back off the
 * send request and echoes it -- the only way the event can match.
 */

export interface MockBackend {
  close: () => Promise<void>;
  /** Delay before the finalization event; 0 emits on the next tick. */
  finalizationDelayMs: number;
  /**
   * When set, finalization events report that the deploy failed on chain.
   *
   * Distinct from silence, and the app must treat it differently: a silent
   * stream means the outcome is unknown and a retry may duplicate, while an
   * errored finalization means nothing was recorded and a retry is safe.
   */
  finalizeErrored: boolean;
  /** When set, no finalization event is emitted at all. */
  silenceFinalization: boolean;
  store: Store;
  url: string;
}

export async function startMockBackend(): Promise<MockBackend> {
  const store = new Store();
  const sockets = new Set<WebSocket>();
  const state = {
    finalizationDelayMs: 20,
    finalizeErrored: false,
    silenceFinalization: false,
  };

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let body: Record<string, unknown> = {};
      if (raw !== "") {
        try {
          body = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          body = {};
        }
      }

      const result = handle({
        body,
        finalize: (signature) => emitFinalization(signature),
        method: request.method ?? "GET",
        path: url.pathname,
        store,
      });

      response.writeHead(result.status, {
        ...result.headers,
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
        "access-control-allow-origin": "*",
      });
      response.end(result.body);
    });
  });

  // Preflight, because the app is served from a different origin than this.
  server.on("request", (request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
        "access-control-allow-origin": "*",
      });
      response.end();
    }
  });

  const wss = new WebSocketServer({ path: undefined, server });
  wss.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  function emitFinalization(signatureBase64: string) {
    if (state.silenceFinalization) {
      return;
    }
    const frame = JSON.stringify({
      cost: "1000",
      deploy_id: deployIdFrom(signatureBase64),
      errored: state.finalizeErrored,
      node_type: "Observer",
      type: "Finalized",
    });
    setTimeout(() => {
      for (const socket of sockets) {
        socket.send(frame);
      }
    }, state.finalizationDelayMs);
  }

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address() as AddressInfo;

  return {
    async close() {
      for (const socket of sockets) {
        socket.close();
      }
      wss.close();
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    },
    get finalizationDelayMs() {
      return state.finalizationDelayMs;
    },
    set finalizationDelayMs(value: number) {
      state.finalizationDelayMs = value;
    },
    get finalizeErrored() {
      return state.finalizeErrored;
    },
    set finalizeErrored(value: boolean) {
      state.finalizeErrored = value;
    },
    get silenceFinalization() {
      return state.silenceFinalization;
    },
    set silenceFinalization(value: boolean) {
      state.silenceFinalization = value;
    },
    store,
    url: `http://127.0.0.1:${String(port)}`,
  };
}

function handle(context: RouteContext): HttpResult {
  const failure = context.store.takeFailure(context.path);
  if (failure !== undefined) {
    return json({ description: failure.description }, failure.status);
  }

  if (context.path === "/api/service/ready") {
    return json({});
  }

  // Order matters only for the two team-prefix modules: the grant routes
  // match their own exact paths (grants, runs, bindings, mail publications,
  // published-channels) and return undefined otherwise, so trying them before
  // the general team routes keeps each request reaching exactly one handler.
  const result =
    agentRoutes(context) ?? grantRoutes(context) ?? teamRoutes(context);
  if (result !== undefined) {
    return result;
  }

  // Anything unrecognised is a test that does not know what it is exercising.
  return json(
    {
      description: `the mock backend has no handler for ${context.method} ${context.path}`,
    },
    501,
  );
}
