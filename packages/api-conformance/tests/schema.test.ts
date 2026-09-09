import {
  compareCatalogues,
  describesABody,
  loadPinnedDocument,
  matchOperation,
  readCatalogue,
} from "@/schema";

/**
 * The route table, read from the document this repository actually pins.
 *
 * These run offline and in the canonical gate. That is the point: the
 * contract-shape facts this campaign reports upstream are derived here, so if
 * the derivation is wrong the reports are wrong, and nobody would find out
 * until a stack was available to run the live half against.
 */

const catalogue = readCatalogue(loadPinnedDocument());

describe("the pinned document", () => {
  it("describes the operations the client was generated from", () => {
    // A specific number rather than "more than zero": this is the figure every
    // coverage claim about the API is measured against, and it moving is
    // itself news. It moved from 55 to 69 when the channel-connector layer
    // landed: grant lifecycle (4), grant reads (2), run-under-grant (2), mail
    // bindings (6, counting both publish and unpublish phases and the two
    // read mirrors).
    expect(catalogue.operations).toHaveLength(69);
    expect(catalogue.schemaNames.length).toBeGreaterThan(100);
  });

  it("names every operation, since the generator relies on it", () => {
    const unnamed = catalogue.operations.filter((operation) =>
      operation.operationId.includes(" "),
    );

    // Named rather than counted: an operation without an operationId gets a
    // generated method name derived from its path, which changes whenever the
    // path does.
    expect(unnamed).toEqual([]);
  });

  it("has no two operations claiming the same identity", () => {
    const seen = new Map<string, number>();
    for (const { operationId } of catalogue.operations) {
      seen.set(operationId, (seen.get(operationId) ?? 0) + 1);
    }
    expect([...seen].filter(([, count]) => count > 1)).toEqual([]);
  });
});

describe("resolving a request to an operation", () => {
  it("matches a templated path segment", () => {
    const operation = matchOperation(
      catalogue,
      "GET",
      "/api/ai-agents/1111CHQEVaYoTj7jNkF9oZX9g3DqJJjyAU7qVbQB5HWuRyXE1Lnru",
    );

    expect(operation?.path).toBe("/api/ai-agents/{address}");
  });

  it("does not let a template swallow a longer path", () => {
    // `{address}` matches ONE segment. If it matched greedily, every deeper
    // route would resolve to the list operation and every conformance verdict
    // about them would be computed against the wrong schema.
    const operation = matchOperation(
      catalogue,
      "GET",
      "/api/ai-agents/some-address/some-id/versions",
    );

    expect(operation?.path).toBe("/api/ai-agents/{address}/{id}/versions");
  });

  it("returns nothing for a path the document does not describe", () => {
    expect(matchOperation(catalogue, "GET", "/api/nope")).toBeUndefined();
  });

  it("distinguishes methods on one path", () => {
    const path = "/api/ai-agents/create/send";
    expect(matchOperation(catalogue, "POST", path)).toBeDefined();
    expect(matchOperation(catalogue, "GET", path)).toBeUndefined();
  });
});

describe("whether a declared response describes a body", () => {
  it("treats an absent content block as no body", () => {
    expect(describesABody({})).toBe(false);
  });

  it("treats an EMPTY schema as no body", () => {
    // The case worth separating out. An empty schema object is worse than an
    // absent one: tooling reports the response as described and generates no
    // type for it, which is how a caller ends up holding `unknown`.
    expect(
      describesABody({ content: { "application/json": { schema: {} } } }),
    ).toBe(false);
  });

  it("accepts a real schema", () => {
    expect(
      describesABody({
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Agents" },
          },
        },
      }),
    ).toBe(true);
  });
});

describe("comparing a pin against a served document", () => {
  it("reports no difference against itself", () => {
    // The false-alarm guard. A byte comparison of two serializations of the
    // same document reports drift that is not there, which has already
    // happened once in this project.
    expect(compareCatalogues(catalogue, catalogue)).toEqual({
      changed: [],
      onlyPinned: [],
      onlyServed: [],
    });
  });

  it("names the operations that differ rather than merely counting them", () => {
    const served = readCatalogue(
      JSON.parse(JSON.stringify(loadPinnedDocument())) as ReturnType<
        typeof loadPinnedDocument
      >,
    );
    const victim = served.operations[0];
    victim.declaredResponses = [...victim.declaredResponses, "409"];

    const difference = compareCatalogues(catalogue, served);

    // "The schema drifted" is not actionable; "this operation gained a 409 the
    // pin does not declare" is.
    expect(difference.changed).toEqual([
      {
        operationId: victim.operationId,
        pinned: expect.not.arrayContaining(["409"]) as string[],
        served: expect.arrayContaining(["409"]) as string[],
      },
    ]);
  });

  it("reports an operation the server has and the pin does not", () => {
    const served = readCatalogue(loadPinnedDocument());
    served.operations = served.operations.filter(
      (operation) => operation.operationId !== "service_ready",
    );

    expect(compareCatalogues(catalogue, served).onlyPinned).toEqual([
      "service_ready",
    ]);
  });
});
