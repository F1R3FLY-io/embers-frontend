import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readEnvironment } from "@/gate";
import { loadPinnedDocument, readCatalogue } from "@/schema";

/**
 * What every operation ACTUALLY answers, as opposed to what it declares.
 *
 * The backend cannot declare accurate error responses from the handler code
 * alone: the statuses a caller meets come from the web framework's extractors
 * as much as from the handler, and those are only visible by asking. This
 * sweep asks all 55, records the answers, and writes them out as the
 * (operation, status, body shape) inventory that a per-operation declaration
 * can be built from.
 *
 * ## Why this cannot mutate anything
 *
 * Every probe is chosen so the request dies before a handler could reach the
 * chain:
 *
 *  - GET operations are read-only by definition. Path parameters are filled
 *    with well-formed values that name nothing, so the answer is whatever the
 *    service says about an absent record.
 *  - POST operations are probed with NO body and then with `{}`. Both are
 *    rejected by the JSON extractor or by field validation, before the handler
 *    runs. No contract is prepared, nothing is signed, no REV is spent.
 *
 * That is also precisely the interesting part: extractor statuses are the ones
 * the handler source does not reveal.
 *
 * The assertion is one property, held across the whole surface: a malformed
 * request must not produce a 5xx. A 5xx here means an unhandled path reached
 * something that threw, which is a finding in its own right rather than a
 * declaration to write down.
 */

const environment = readEnvironment();
const UNAVAILABLE = process.env.EMBERS_ITEST_UNAVAILABLE;
const liveIt = UNAVAILABLE === undefined ? it : it.skip;

const catalogue = readCatalogue(loadPinnedDocument());

/** Well-formed values that name nothing, so no record is ever touched. */
const PATH_VALUES: Record<string, string> = {
  address: "1111CHQEVaYoTj7jNkF9oZX9g3DqJJjyAU7qVbQB5HWuRyXE1Lnru",
  agent_id: "00000000-0000-4000-8000-000000000001",
  id: "00000000-0000-4000-8000-000000000001",
  run_id: "00000000-0000-4000-8000-000000000002",
  version: "00000000-0000-7000-8000-000000000003",
};

function concretePath(templated: string): string {
  return templated.replace(/\{([^}]+)\}/g, (_, name: string) => {
    return PATH_VALUES[name] ?? "00000000-0000-4000-8000-00000000ffff";
  });
}

/** The SHAPE of a body: its type and keys, never its values. */
function shapeOf(body: unknown): string {
  if (body === null) {
    return "null";
  }
  if (typeof body === "string") {
    return body === "" ? "empty" : `text(${String(body.length)})`;
  }
  if (Array.isArray(body)) {
    return `array[${String(body.length)}]`;
  }
  if (typeof body === "object") {
    const keys = Object.keys(body as Record<string, unknown>).sort();
    return keys.length === 0 ? "object{}" : `object{${keys.join(",")}}`;
  }
  return typeof body;
}

interface Observation {
  bodyShape: string;
  contentType: string;
  method: string;
  operationId: string;
  path: string;
  probe: string;
  status: number;
}

async function probe(
  operationId: string,
  method: string,
  templated: string,
  probeName: string,
  body: string | undefined,
): Promise<Observation> {
  const path = concretePath(templated);
  const response = await fetch(`${environment.apiUrl}${path}`, {
    body,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    method,
    signal: AbortSignal.timeout(30_000),
  });

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    /* a non-JSON body is itself worth recording */
  }

  return {
    bodyShape: shapeOf(parsed),
    contentType: response.headers.get("content-type") ?? "",
    method: method.toUpperCase(),
    operationId,
    path: templated,
    probe: probeName,
    status: response.status,
  };
}

liveIt(
  "records what every operation answers, and none answers a 5xx",
  async () => {
    const observations: Observation[] = [];

    // Serial on purpose, and the rule against awaiting in a loop is the wrong
    // advice here: the whole point is to stay gentler than an ordinary page
    // load against a service someone else is also using. Parallelising would
    // turn a survey into a burst.
    /* eslint-disable no-await-in-loop */
    for (const operation of catalogue.operations) {
      if (operation.method === "get") {
        observations.push(
          await probe(
            operation.operationId,
            "GET",
            operation.path,
            "absent-record",
            undefined,
          ),
        );
      } else {
        observations.push(
          await probe(
            operation.operationId,
            operation.method.toUpperCase(),
            operation.path,
            "no-body",
            undefined,
          ),
        );
        observations.push(
          await probe(
            operation.operationId,
            operation.method.toUpperCase(),
            operation.path,
            "empty-object",
            "{}",
          ),
        );
      }
      // Spaced so the sweep stays gentler than an ordinary page load.
      await new Promise((resolve) => {
        setTimeout(resolve, 60);
      });
    }
    /* eslint-enable no-await-in-loop */

    const directory = process.env.EMBERS_ITEST_ARTIFACTS ?? "artifacts";
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, "status-inventory.json"),
      `${JSON.stringify(
        {
          apiUrl: environment.apiUrl,
          observations,
          operations: catalogue.operations.length,
        },
        null,
        2,
      )}\n`,
    );

    const table = [
      "| operation | method | probe | status | body shape |",
      "| --- | --- | --- | --- | --- |",
      ...observations.map(
        (o) =>
          `| \`${o.operationId}\` | ${o.method} | ${o.probe} | ${String(o.status)} | \`${o.bodyShape}\` |`,
      ),
    ].join("\n");
    writeFileSync(join(directory, "status-inventory.md"), `${table}\n`);

    // Named rather than counted: a 5xx from a malformed request is an
    // unhandled path, and the report has to say which operation.
    const serverErrors = observations
      .filter((o) => o.status >= 500)
      .map((o) => `${o.operationId} (${o.probe})`);

    // PINNED, NOT ENDORSED. Both of these answer 500 where the error text is
    // literally "agents team not found", so the semantic is 404 and only the
    // mapping is wrong. Reported upstream with reproductions; the
    // published-state one additionally returns a 78 KB Rust backtrace carrying
    // absolute host paths.
    //
    // Listed rather than tolerated wholesale: a 5xx from any OTHER operation
    // still fails, so this stays a working guard while the known two are
    // outstanding. Delete an entry when its fix lands and the assertion will
    // hold the improvement.
    const REPORTED_UPSTREAM = [
      "agents_teams_published_state (absent-record)",
      "agents_teams_unpublish (no-body)",
      "agents_teams_unpublish (empty-object)",
    ];

    expect(
      serverErrors.filter((entry) => !REPORTED_UPSTREAM.includes(entry)),
    ).toEqual([]);
  },
  600_000,
);
