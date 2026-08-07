import {
  absentContentResponses,
  emptySchemaResponses,
  makeValidator,
  successOnlyOperations,
} from "@/conformance";
import { loadPinnedDocument, readCatalogue } from "@/schema";

/**
 * The validator that decides whether a response conformed, checked against
 * bodies whose correctness is known.
 *
 * A validator nobody has tested is worse than none: it produces verdicts that
 * look authoritative. These pin both directions -- a conforming body passes, a
 * body wrong in each way that matters fails -- so a verdict means something.
 */

const catalogue = readCatalogue(loadPinnedDocument());
const validator = makeValidator(catalogue);

describe("validating against the pinned component schemas", () => {
  it("compiles every schema the document declares", () => {
    // If a schema failed to compile, every body checked against it would be
    // reported as unvalidatable rather than as wrong, and the difference would
    // not be visible in a summary.
    expect(validator.known).toHaveLength(catalogue.schemaNames.length);
  });

  it("accepts a well-formed body", () => {
    expect(
      validator.validate("Agents", {
        agents: [
          {
            created_at: "1754582400000",
            id: "3f1d0b4e-0000-4000-8000-000000000001",
            name: "Researcher",
            version: "0192f0a0-0000-7000-8000-000000000001",
          },
        ],
      }),
    ).toEqual([]);
  });

  it("rejects a body missing a required property", () => {
    const findings = validator.validate("Agents", {});

    expect(findings).not.toEqual([]);
    expect(findings.every(({ severity }) => severity === "error")).toBe(true);
    expect(findings.map(({ message }) => message).join(" ")).toContain(
      "agents",
    );
  });

  it("rejects a property of the wrong type", () => {
    // The shape a coercing client would hide: the SDK's mappers would turn a
    // number into something, and the caller would never learn the server sent
    // the wrong type.
    const findings = validator.validate("Agents", {
      agents: [
        {
          created_at: "1754582400000",
          id: 17,
          name: "Researcher",
          version: "0192f0a0-0000-7000-8000-000000000001",
        },
      ],
    });

    expect(findings.some(({ severity }) => severity === "error")).toBe(true);
  });

  it("says so plainly when asked about a schema that does not exist", () => {
    expect(validator.validate("NoSuchThing", {})).toEqual([
      {
        instancePath: "",
        message: "no component schema named NoSuchThing",
        severity: "error",
      },
    ]);
  });
});

describe("the domain formats the document declares", () => {
  // Ajv silently ignores a format it does not know, which would reduce each of
  // these fields to "is a string" -- and being a string is not the interesting
  // property of an amount, a timestamp, or a registry address. Each is
  // asserted in both directions, so that "ignored" cannot masquerade as
  // "valid".
  //
  // The formats are declared inline on properties rather than as named
  // schemas, so each is exercised through the schema that carries it.

  const boost = (overrides: Record<string, string> = {}) => ({
    amount: "1000",
    from: "1111CHQEVaYoTj7jNkF9oZX9g3DqJJjyAU7qVbQB5HWuRyXE1Lnru",
    id: "3f1d0b4e-0000-4000-8000-000000000001",
    post_author_did: "did:plc:abc123",
    timestamp: "1754582400000",
    to: "1111KrTaRVMLQZUW1YvpQoHXKJQxHRDbBNbHnCJPmvUZLQPeAcxKG",
    ...overrides,
  });

  it("accepts a well-formed record carrying every format", () => {
    expect(validator.validate("Boost", boost())).toEqual([]);
  });

  it("rejects an amount that is not a number at all", () => {
    expect(
      validator.validate("Boost", boost({ amount: "lots" })).length,
    ).toBeGreaterThan(0);
  });

  it("rejects an int64 beyond the representable range", () => {
    expect(
      validator.validate("Boost", boost({ amount: String(2n ** 63n) })).length,
    ).toBeGreaterThan(0);
  });

  it("accepts an int64 at the top of the range", () => {
    expect(
      validator.validate("Boost", boost({ amount: String(2n ** 63n - 1n) })),
    ).toEqual([]);
  });

  it("rejects a timestamp in the wrong unit", () => {
    // Nanoseconds where milliseconds are expected: a plausible string of
    // digits that would otherwise pass, and then date a record roughly thirty
    // thousand years from now.
    expect(
      validator.validate("Boost", boost({ timestamp: "1754582400000000000" }))
        .length,
    ).toBeGreaterThan(0);
  });

  it("rejects an address that is not one", () => {
    expect(
      validator.validate("Boost", boost({ from: "not-an-address" })).length,
    ).toBeGreaterThan(0);
  });

  it("rejects a registry URI without its scheme", () => {
    expect(
      validator.validate("AgentsTeam", {
        created_at: "1754582400000",
        id: "3f1d0b4e-0000-4000-8000-000000000001",
        name: "Research Desk",
        uri: "pz3c7z73o17qzpbj85khapi9ne3e489gtaqwp56ake9sohj6q5qyi3",
        version: "0192f0a0-0000-7000-8000-000000000001",
      }).length,
    ).toBeGreaterThan(0);
  });

  it("rejects base64 that is not a whole number of quanta", () => {
    // Truncated bytes: what a naive concatenation produces, and what the SDK
    // would decode into a shorter buffer without complaint.
    expect(
      validator.validate("BoostResp", { contract: "AQIDBA" }).length,
    ).toBeGreaterThan(0);
    expect(validator.validate("BoostResp", { contract: "AQIDBAU=" })).toEqual(
      [],
    );
  });

  it("rejects a revision that is negative", () => {
    expect(
      validator.validate("RunCommandReq", {
        expected_revision: "-1",
        type: "Signal",
      }).length,
    ).toBeGreaterThan(0);
  });
});

describe("contract gaps the document itself has", () => {
  // These figures are the evidence behind findings already sent upstream, so
  // they are asserted EXACTLY. A fix upstream should show up here as a failing
  // expectation to be updated -- which is the notification -- rather than
  // silently changing a number nobody looks at.

  it("names the three responses declared with an empty schema", () => {
    // The harmful kind. Tooling reports these as described and generates no
    // type, which is the direct cause of `sendResponse: unknown` in the SDK's
    // run, command, and reveal methods -- all three of which do return
    // structured state. Reported upstream as EMB-0007.
    expect(
      emptySchemaResponses(catalogue).map(({ operationId }) => operationId),
    ).toEqual([
      "agents_teams_send_reveal_output",
      "agents_teams_send_run",
      "agents_teams_send_run_command",
    ]);
  });

  it("names the four responses that declare no content at all", () => {
    // The benign-looking kind, kept separate because the fix differs and two
    // of these are legitimate: a readiness probe really has no body, and the
    // deploys subscription is a WebSocket upgrade rather than a JSON response.
    // The other two return state the caller cannot see typed.
    expect(
      absentContentResponses(catalogue).map(({ operationId }) => operationId),
    ).toEqual([
      "agents_teams_send_run_on_firesky",
      "agents_teams_unpublish",
      "service_ready",
      "wallets_subscribe_deploys",
    ]);
  });

  it("counts the operations that declare only a success", () => {
    // An operation declaring only 200 gives a generated client no way to type
    // its failures, which is why every error in the SDK arrives as a bare
    // ResponseError carrying only a status. Reported upstream as EMB-0006.
    expect(successOnlyOperations(catalogue)).toHaveLength(44);
    expect(catalogue.operations).toHaveLength(55);
  });
});
