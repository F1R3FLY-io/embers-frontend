import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  banner,
  blockedReason,
  isLoopback,
  probeStack,
  readEnvironment,
} from "@/gate";
import { asCurl, Ledger, redact } from "@/ledger";

/**
 * The gate and the ledger, which decide whether a run happens and what it
 * leaves behind.
 *
 * Both are the kind of code that is never exercised on the happy path and is
 * relied on entirely when something is wrong, so they are tested directly
 * rather than incidentally.
 */

describe("deciding whether a live run may proceed", () => {
  it("refuses without the opt-in, and says how to opt in", () => {
    const reason = blockedReason(readEnvironment({}));

    expect(reason).toContain("EMBERS_INTEGRATION=1");
  });

  it("proceeds against a loopback address once opted in", () => {
    expect(
      blockedReason(
        readEnvironment({
          EMBERS_API_URL: "http://127.0.0.1:8080",
          EMBERS_INTEGRATION: "1",
        }),
      ),
    ).toBeUndefined();
  });

  it("refuses a non-loopback address, naming it", () => {
    // This campaign signs real payloads and probes error paths. Doing that to
    // someone else's host is not a test, and a stray environment variable
    // should not be enough to start.
    const reason = blockedReason(
      readEnvironment({
        EMBERS_API_URL: "https://embers.example.com",
        EMBERS_INTEGRATION: "1",
      }),
    );

    expect(reason).toContain("embers.example.com");
    expect(reason).toContain("EMBERS_ITEST_ALLOW_REMOTE=1");
  });

  it("allows a non-loopback address when that is stated explicitly", () => {
    expect(
      blockedReason(
        readEnvironment({
          EMBERS_API_URL: "https://embers.example.com",
          EMBERS_INTEGRATION: "1",
          EMBERS_ITEST_ALLOW_REMOTE: "1",
        }),
      ),
    ).toBeUndefined();
  });
});

describe("recognising a loopback address", () => {
  it.each([
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://127.5.5.5:1",
    "http://[::1]:8080",
  ])("accepts %s", (url) => {
    expect(isLoopback(url)).toBe(true);
  });

  it.each([
    "http://embers.example.com",
    "http://10.0.0.5:8080",
    "http://[2001:db8::1]:8080",
    "not a url",
  ])("rejects %s", (url) => {
    expect(isLoopback(url)).toBe(false);
  });
});

describe("probing the stack before anything is submitted", () => {
  it("reports a healthy service", async () => {
    const probes = await probeStack(
      readEnvironment({ EMBERS_INTEGRATION: "1" }),
      (async () =>
        Promise.resolve(new Response("{}", { status: 200 }))) as never,
    );

    expect(probes).toEqual([
      { detail: "HTTP 200", name: "service_ready", ok: true },
    ]);
  });

  it("distinguishes up-but-not-ready from unreachable", async () => {
    const notReady = await probeStack(
      readEnvironment({ EMBERS_INTEGRATION: "1" }),
      (async () => Promise.resolve(new Response("", { status: 503 }))) as never,
    );
    expect(notReady[0].ok).toBe(false);
    expect(notReady[0].remedy).toContain("not ready");

    const unreachable = await probeStack(
      readEnvironment({ EMBERS_INTEGRATION: "1" }),
      (async () => Promise.reject(new Error("ECONNREFUSED"))) as never,
    );
    expect(unreachable[0].ok).toBe(false);
    // The remedy differs because the fix differs: wait, versus start the stack.
    expect(unreachable[0].remedy).toContain("Start the local Embers stack");
  });
});

describe("the banner", () => {
  it("boxes the message so a skipped run is not read as a passed one", () => {
    const rendered = banner("Skipped", "one\ntwo");

    const lines = rendered.split("\n");
    expect(lines[0].startsWith("┌")).toBe(true);
    expect(lines.at(-1)?.startsWith("└")).toBe(true);
    // Every line the same width, or the box does not read as one. Counted
    // in code points on purpose: the border characters are non-ASCII, and
    // UTF-16 units would measure them wrong.
    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    expect(new Set(lines.map((line) => [...line].length)).size).toBe(1);
  });
});

describe("the evidence ledger", () => {
  it("writes one line per call, with a reproduction", () => {
    const directory = mkdtempSync(join(tmpdir(), "embers-ledger-"));
    const ledger = new Ledger(directory);

    ledger.record({
      durationMs: 12,
      method: "POST",
      operationId: "agents_prepare_create",
      requestBody: { name: "Researcher" },
      responseBody: { token: "abc" },
      scenarioId: "AG-H-01",
      status: 200,
      url: "http://127.0.0.1:8080/api/ai-agents/create/prepare",
    });

    const written = readFileSync(join(directory, "ledger.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(written).toHaveLength(1);
    expect(written[0].seq).toBe(1);
    expect(written[0].curl).toContain("curl");
    expect(written[0].curl).toContain("/api/ai-agents/create/prepare");
  });

  it("hashes credentials rather than recording them", () => {
    const redacted = redact({
      email: "team@example.test",
      nested: { secret_key: "0b4e" },
      password: "hunter2hunter2",
    }) as Record<string, unknown>;

    expect(redacted.email).toBe("team@example.test");
    expect(redacted.password).not.toBe("hunter2hunter2");
    expect(String(redacted.password)).toMatch(/^sha256:/);
    expect(
      String((redacted.nested as Record<string, unknown>).secret_key),
    ).toMatch(/^sha256:/);
  });

  it("keeps the prepare token, because a repro needs it", () => {
    // Deliberately NOT redacted: reproducing a send requires the token, it
    // expires within a day, and its signing secret is regenerated per process.
    const redacted = redact({ token: "eyJhbGciOi" }) as Record<string, unknown>;

    expect(redacted.token).toBe("eyJhbGciOi");
  });

  it("redacts the body it puts in the reproduction too", () => {
    const command = asCurl({
      durationMs: 1,
      method: "POST",
      operationId: "x",
      requestBody: { password: "hunter2hunter2" },
      scenarioId: "s",
      seq: 1,
      status: 200,
      url: "http://127.0.0.1:8080/x",
    });

    // A curl a reader can paste into a terminal is also a curl they can paste
    // into an issue.
    expect(command).not.toContain("hunter2hunter2");
    expect(command).toContain("sha256:");
  });
});
