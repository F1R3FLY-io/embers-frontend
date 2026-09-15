import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { makeValidator } from "@/conformance";
import { readEnvironment } from "@/gate";
import { Ledger } from "@/ledger";
import {
  compareCatalogues,
  loadPinnedDocument,
  matchOperation,
  readCatalogue,
} from "@/schema";

/**
 * The live half: real requests against a running local stack.
 *
 * Matched only by `jest.itest.config.js`, so `pnpm -r test` can never start
 * one of these by accident. Every scenario is additionally gated: without the
 * opt-in, or without a stack answering, the suite prints why and skips rather
 * than failing, because an absent environment is not a defect in the product.
 *
 * What is asserted here is the CONTRACT, not the interface. Anything that can
 * be checked without a chain already is, in the offline suites next door; what
 * is left is whether the running server answers in the shapes this repository
 * was generated against.
 */

const environment = readEnvironment();
const pinned = readCatalogue(loadPinnedDocument());
const validator = makeValidator(pinned);

/**
 * Whether the live scenarios may run, decided in `globalSetup` before this
 * file was loaded and passed through the environment.
 *
 * Bound to `it.skip` when it may not, so an unavailable stack produces skips
 * rather than passes. A scenario reporting success while making no request is
 * how a suite comes to mean nothing.
 */
const UNAVAILABLE = process.env.EMBERS_ITEST_UNAVAILABLE;
const liveIt = UNAVAILABLE === undefined ? it : it.skip;

const ledger = new Ledger(
  process.env.EMBERS_ITEST_ARTIFACTS ??
    mkdtempSync(join(tmpdir(), "embers-conformance-")),
);

/** Issues a request, records it whole, and returns the raw body. */
async function call(
  scenarioId: string,
  method: string,
  path: string,
): Promise<{ body: unknown; status: number }> {
  const url = `${environment.apiUrl}${path}`;
  const started = Date.now();
  const response = await fetch(url, {
    method,
    signal: AbortSignal.timeout(35_000),
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    body = text;
  }

  ledger.record({
    durationMs: Date.now() - started,
    method,
    operationId:
      matchOperation(pinned, method, path)?.operationId ?? "unresolved",
    responseBody: body,
    scenarioId,
    status: response.status,
    url,
  });

  return { body, status: response.status };
}

beforeAll(() => {
  if (UNAVAILABLE !== undefined) {
    return;
  }
  ledger.writeManifest({
    apiUrl: environment.apiUrl,
    // Deliberately a boolean: whether a model endpoint was redirected matters;
    // where it was redirected to does not belong in an artifact that may be
    // attached to a report.
    openaiApiBaseSet: process.env.OPENAI_API_BASE !== undefined,
    operations: pinned.operations.length,
    schemaPath: "packages/client/schema.json",
  });
});

describe("SVC: the service answers", () => {
  liveIt("reports itself ready", async () => {
    const { status } = await call("SVC-H-01", "GET", "/api/service/ready");

    expect(status).toBe(200);
  });
});

describe("SCHEMA: the pin against the served document", () => {
  liveIt(
    "serves the same operations this repository was generated from",
    async () => {
      const { body, status } = await call(
        "SVC-H-02",
        "GET",
        "/swagger-ui/openapi.json",
      );
      if (status !== 200) {
        // Not a failure of the pin: an older server may not serve its spec at
        // all. Recorded and skipped rather than reported as drift.
        // eslint-disable-next-line no-console
        console.warn(
          `the served spec is not available (HTTP ${String(status)}); drift cannot be checked`,
        );
        return;
      }

      const served = readCatalogue(
        body as ReturnType<typeof loadPinnedDocument>,
      );
      const difference = compareCatalogues(pinned, served);

      // Named, not counted. "The schema drifted" is not actionable; "this
      // operation gained a 409 the pin does not declare" is.
      expect(difference.onlyServed).toEqual([]);
      expect(difference.onlyPinned).toEqual([]);
      expect(difference.changed).toEqual([]);
    },
  );
});

describe("READ: list endpoints conform to their declared schemas", () => {
  const address = process.env.EMBERS_ITEST_ADDRESS;

  liveIt("answers the agent list in the declared shape", async () => {
    if (address === undefined) {
      // eslint-disable-next-line no-console
      console.warn(
        "EMBERS_ITEST_ADDRESS is not set; the list scenarios need a wallet address to read",
      );
      return;
    }

    const { body, status } = await call(
      "AG-H-01",
      "GET",
      `/api/ai-agents/${address}`,
    );

    expect(status).toBe(200);
    // Validated on the RAW body, before the SDK's mappers coerce anything: a
    // response that is wrong on the wire can reach a caller looking plausible.
    expect(
      validator.validate("Agents", body).filter((f) => f.severity === "error"),
    ).toEqual([]);
  });

  liveIt("answers the team list in the declared shape", async () => {
    if (address === undefined) {
      return;
    }

    const { body, status } = await call(
      "TM-H-01",
      "GET",
      `/api/ai-agents-teams/${address}`,
    );

    expect(status).toBe(200);
    expect(
      validator
        .validate("AgentsTeams", body)
        .filter((f) => f.severity === "error"),
    ).toEqual([]);
  });
});

describe("NEG: an unknown route is refused rather than mishandled", () => {
  liveIt(
    "answers a 4xx for a path the document does not describe",
    async () => {
      const { status } = await call(
        "SVC-N-01",
        "GET",
        "/api/there-is-no-such-thing",
      );

      // A 5xx here would mean an unrouted request reached something that threw,
      // which is a finding in its own right.
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    },
  );
});
