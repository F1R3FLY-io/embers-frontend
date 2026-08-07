import type { FetchAPI } from "@/api-client";

/**
 * A scriptable HTTP transport, injected rather than patched.
 *
 * WHY NOT MSW HERE. Every service takes `fetchApi` through its config, so a
 * test can hand the SDK a transport directly. That is strictly better than
 * intercepting the process's global fetch for this layer: it is scoped to one
 * SDK instance, so parallel suites cannot interfere; it needs no server
 * lifecycle; and it still runs every line of the generated client, because the
 * runtime builds the URL, headers, and body and only then calls `fetchApi`.
 * Nothing under test is bypassed -- the seam is below serialization, not above
 * it. MSW earns its place in the app's suites, where the SDK is constructed
 * inside WalletProvider and there is no argument to inject through.
 *
 * The transport records every exchange, which is what makes the two-phase
 * protocol testable at all: the interesting properties are ORDER (prepare
 * strictly before send), CONTENT (the send envelope echoes the prepare and
 * carries a signature over the right bytes), and ABSENCE (a call that must not
 * happen, such as a send after an aborted prepare).
 */

export interface RecordedRequest {
  body: unknown;
  method: string;
  path: string;
  url: string;
}

export interface RouteResponse {
  /** Response body; objects are JSON-encoded. */
  body?: unknown;
  /** Fail with a network-level error rather than a status. */
  networkError?: boolean;
  status?: number;
}

export type RouteHandler =
  | RouteResponse
  | ((request: RecordedRequest) => RouteResponse);

export interface ScriptedTransport {
  fetchApi: FetchAPI;
  /** Requests whose path contains the given fragment. */
  matching: (fragment: string) => RecordedRequest[];
  /** Registers or replaces the handler for a path fragment. */
  on: (fragment: string, handler: RouteHandler) => ScriptedTransport;
  /** The single request whose path contains the fragment; throws otherwise. */
  only: (fragment: string) => RecordedRequest;
  /** Path fragments in the order they were requested. */
  order: () => string[];
  /** Every exchange, in the order it was issued. */
  readonly requests: RecordedRequest[];
}

/**
 * Routes are matched by path FRAGMENT rather than by exact URL.
 *
 * The generated client owns URL construction, so an exact-match table would
 * encode the very thing under test and would break on every path change for
 * reasons unrelated to the service. Fragments state the intent -- "the create
 * prepare call" -- while leaving the client free to build the address.
 */
export function scriptedTransport(): ScriptedTransport {
  const routes: { fragment: string; handler: RouteHandler }[] = [];
  const requests: RecordedRequest[] = [];

  // Answers from the script, so nothing is awaited; the promise is the
  // FetchAPI contract the generated client calls through.
  // eslint-disable-next-line @typescript-eslint/require-await
  const fetchApi: FetchAPI = async (input, init) => {
    // The generated client always passes a string URL here. Narrowed rather
    // than stringified so a Request or URL object fails loudly instead of
    // becoming "[object Object]" and matching no route.
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const path = new URL(url).pathname;

    let body: unknown;
    const raw = init?.body;
    if (typeof raw === "string") {
      try {
        body = JSON.parse(raw) as unknown;
      } catch {
        body = raw;
      }
    }

    const request: RecordedRequest = {
      body,
      method: (init?.method ?? "GET").toUpperCase(),
      path,
      url,
    };
    requests.push(request);

    // An aborted call must reject before the transport answers, or a test could
    // not distinguish "cancelled in flight" from "completed and ignored".
    if (init?.signal?.aborted === true) {
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    }

    // Last matching route wins, so a test can override a default per case.
    const route = [...routes].reverse().find((r) => path.includes(r.fragment));
    if (route === undefined) {
      throw new Error(
        `no scripted response for ${request.method} ${path}; ` +
          `scripted fragments: ${routes.map((r) => r.fragment).join(", ")}`,
      );
    }

    const response =
      typeof route.handler === "function"
        ? route.handler(request)
        : route.handler;

    if (response.networkError === true) {
      throw new TypeError("network request failed");
    }

    const status = response.status ?? 200;
    const payload =
      response.body === undefined ? "" : JSON.stringify(response.body);

    return new Response(payload === "" ? null : payload, {
      headers: { "content-type": "application/json" },
      status,
    });
  };

  const transport: ScriptedTransport = {
    fetchApi,
    matching: (fragment) => requests.filter((r) => r.path.includes(fragment)),
    on(fragment, handler) {
      routes.push({ fragment, handler });
      return transport;
    },
    only(fragment) {
      const found = requests.filter((r) => r.path.includes(fragment));
      if (found.length !== 1) {
        throw new Error(
          `expected exactly one request matching "${fragment}", got ${String(found.length)}`,
        );
      }
      return found[0];
    },
    order: () =>
      requests.map((r) => {
        const fragment = routes.find((route) =>
          r.path.includes(route.fragment),
        );
        return fragment?.fragment ?? r.path;
      }),
    requests,
  };

  return transport;
}
