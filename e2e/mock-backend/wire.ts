import { randomUUID } from "node:crypto";

import type { Store } from "./store";

/**
 * The wire vocabulary shared by every route.
 *
 * The generated client renames on serialization -- `prepareRequest` goes out as
 * `prepare_request`, `sigAlgorithm` as `sig_algorithm` -- so a handler that
 * reads camelCase reads nothing. These helpers are the one place that knows the
 * transport spelling, which keeps the route modules describing behaviour rather
 * than re-deriving the envelope each time.
 */

export interface HttpResult {
  body: string;
  headers: Record<string, string>;
  status: number;
}

export interface RouteContext {
  body: Record<string, unknown>;
  /** Emits the finalization event the client is waiting for. */
  finalize: (signatureBase64: string) => void;
  method: string;
  path: string;
  store: Store;
}

/** A route that does not recognise the request returns undefined. */
export type Route = (context: RouteContext) => HttpResult | undefined;

/** Any base64; the client never inspects a prepared contract's bytes. */
export const CONTRACT_BASE64 = "AQIDBAU=";

export function json(body: unknown, status = 200): HttpResult {
  return {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json; charset=utf-8" },
    status,
  };
}

export function notFound(): HttpResult {
  return { body: "", headers: {}, status: 404 };
}

export function badRequest(description: string): HttpResult {
  // Shaped like the server's own failures, which write their diagnostics into
  // `description` -- the field the app surfaces through `failureReason`.
  return json({ description }, 400);
}

/** base64 signature bytes to the lowercase hex the client waits on. */
export function deployIdFrom(signatureBase64: string): string {
  return Buffer.from(signatureBase64, "base64").toString("hex");
}

/**
 * The signature the client signed this request with.
 *
 * Three envelope shapes are in use and all of them are ordinary: most sends
 * carry `request.sig`, a deploy nests its two signed contracts under
 * `request.contract`, and a delete posts the SignedContract as the whole body.
 * Reading the signature back is not a convenience -- the deploy id the client
 * waits on is derived from its OWN signature, so an event built from anything
 * else can never match.
 */
export function signatureOf(body: Record<string, unknown>): string {
  const request = body.request as
    | { contract?: { sig?: string }; sig?: string }
    | undefined;

  return (
    request?.sig ??
    request?.contract?.sig ??
    (body.sig as string | undefined) ??
    ""
  );
}

/**
 * The `{prepare_request, prepare_response}` a send echoes back.
 *
 * Both come back as `unknown`: nothing here has checked their shape, and a
 * generic parameter would only be a cast wearing the costume of inference.
 * Each route names the shape it expects at the point it relies on it.
 */
export function preparedOf(body: Record<string, unknown>): {
  request: unknown;
  response: unknown;
} {
  return {
    request: body.prepare_request ?? {},
    response: body.prepare_response ?? {},
  };
}

/** A prepare response, in the `{response, token}` envelope sends echo. */
export function prepared(response: Record<string, unknown>): HttpResult {
  return json({
    response: { contract: CONTRACT_BASE64, ...response },
    // The real token binds a send to its prepare. Nothing in the browser reads
    // it, so a constant is honest here: the mock does not pretend to enforce a
    // binding it has no key for.
    token: "mock-prepare-token",
  });
}

/** Milliseconds, as the wire spells them: a decimal string. */
export function timestamp(value: number): string {
  return String(value);
}

/** Versions are UUIDv7 on the server; sortability is all the app relies on. */
export function newVersion(): string {
  return randomUUID();
}

export function newId(): string {
  return randomUUID();
}

/**
 * The agent ids a team's workflow definition references.
 *
 * Read from the definition rather than tracked separately so that the
 * referencing endpoint tells the truth about teams the APPLICATION built, not
 * only about ones a test seeded. That is the whole point of the cascade
 * warning: it has to be right about a team the user just assembled.
 */
export function agentIdsIn(definition: unknown): string[] {
  const nodes = (
    definition as { nodes?: Record<string, unknown> | null } | undefined
  )?.nodes;
  if (nodes === undefined || nodes === null) {
    return [];
  }

  const ids = new Set<string>();
  for (const node of Object.values(nodes)) {
    const activity = (node as { activity?: unknown } | undefined)?.activity as
      | { agentId?: unknown; kind?: unknown }
      | undefined;
    if (activity?.kind === "agent" && typeof activity.agentId === "string") {
      ids.add(activity.agentId);
    }
  }
  return [...ids];
}
