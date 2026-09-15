/**
 * Whether a live run may proceed, and why not when it may not.
 *
 * Two failure modes are worth distinguishing and both are common. A run
 * launched without opting in should say so and do nothing; a run that opted in
 * but cannot reach the stack should say WHICH piece is missing. Collapsing
 * them into "skipped" sends the reader to look at the wrong thing, and
 * collapsing either into a failure makes an absent environment look like a
 * broken product.
 */

export interface RunEnvironment {
  /** Refuse anything that is not loopback unless explicitly overridden. */
  allowRemote: boolean;
  apiUrl: string;
  enabled: boolean;
  /** Fail the process on an unavailable stack instead of exiting 0. */
  requireStack: boolean;
  wsUrl: string;
}

export function readEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): RunEnvironment {
  const apiUrl = env.EMBERS_API_URL ?? "http://[::1]:8080";
  return {
    allowRemote: env.EMBERS_ITEST_ALLOW_REMOTE === "1",
    apiUrl,
    enabled: env.EMBERS_INTEGRATION === "1",
    requireStack: env.EMBERS_ITEST_REQUIRE_STACK === "1",
    wsUrl: env.EMBERS_WS_URL ?? apiUrl,
  };
}

/**
 * Whether a host is one this campaign is allowed to probe.
 *
 * The whole campaign is defined as local: it signs real payloads, submits real
 * mutations, and fuzzes error paths. Doing any of that to a host someone else
 * operates is not a test, so a non-loopback address is refused rather than
 * quietly accepted from a stray environment variable.
 */
export function isLoopback(url: string): boolean {
  let host: string;
  try {
    ({ hostname: host } = new URL(url));
  } catch {
    return false;
  }
  const bare = host.replace(/^\[|\]$/g, "");
  return (
    bare === "localhost" ||
    bare === "::1" ||
    bare === "0:0:0:0:0:0:0:1" ||
    /^127\./.test(bare)
  );
}

/** The reason a run may not proceed, or undefined when it may. */
export function blockedReason(environment: RunEnvironment): string | undefined {
  if (!environment.enabled) {
    return (
      "The API-conformance campaign is opt-in. It submits real mutations to a " +
      "local chain and takes tens of minutes.\n\n" +
      "  EMBERS_INTEGRATION=1 pnpm --filter @f1r3fly-io/embers-api-conformance itest\n"
    );
  }

  if (!environment.allowRemote && !isLoopback(environment.apiUrl)) {
    return (
      `EMBERS_API_URL is ${environment.apiUrl}, which is not loopback.\n` +
      "This campaign signs real payloads, submits real mutations, and probes " +
      "error paths; it is defined as a local exercise. Point it at a local " +
      "stack, or set EMBERS_ITEST_ALLOW_REMOTE=1 if you are certain.\n"
    );
  }

  return undefined;
}

export interface Probe {
  detail?: string;
  name: string;
  ok: boolean;
  remedy?: string;
}

/**
 * Checks the stack answers before a single scenario runs.
 *
 * Each probe is separate and named. A dead socket discovered halfway through a
 * mutation costs the full finalization budget before it reports anything, and
 * reports it as a timeout -- which is the least informative thing it could
 * say.
 */
export async function probeStack(
  environment: RunEnvironment,
  fetchImpl: typeof fetch = fetch,
): Promise<Probe[]> {
  const probes: Probe[] = [];

  try {
    const response = await fetchImpl(
      `${environment.apiUrl}/api/service/ready`,
      { signal: AbortSignal.timeout(5_000) },
    );
    probes.push({
      detail: `HTTP ${String(response.status)}`,
      name: "service_ready",
      ok: response.ok,
      remedy: response.ok
        ? undefined
        : "The service is up but reports itself not ready; give it a moment or check its logs.",
    });
  } catch (error) {
    probes.push({
      detail: error instanceof Error ? error.message : String(error),
      name: "service_ready",
      ok: false,
      remedy: `Nothing is listening at ${environment.apiUrl}. Start the local Embers stack.`,
    });
  }

  return probes;
}

/** Renders a boxed banner, so a skipped run is not mistaken for a passed one. */
export function banner(title: string, body: string): string {
  const lines = [title, "", ...body.split("\n")];
  const width = Math.max(...lines.map((line) => line.length));
  const rule = "─".repeat(width + 2);
  return [
    `┌${rule}┐`,
    ...lines.map((line) => `│ ${line.padEnd(width)} │`),
    `└${rule}┘`,
  ].join("\n");
}
