import { coerceOslfWorkspaceState } from "@/pages/OSLF/graph/OSLFStateCoerce";

import { fc } from "./helpers/fc";

// The gate between a stored Blockly workspace and the editor that loads it.
//
// The state comes back from the chain, was written by a possibly older version
// of the editor, and is handed straight to Blockly. Blockly does not validate
// it: a malformed document throws somewhere inside the library, which surfaces
// as a blank editor with a stack trace that names nothing the user did. So this
// function's whole job is to answer "is this loadable" and return null when it
// is not -- and it had no tests.

function validState(overrides: Record<string, unknown> = {}) {
  return {
    blocks: {
      blocks: [{ id: "b1", type: "proc_zero" }],
      languageVersion: 0,
      ...overrides,
    },
  };
}

describe("accepting", () => {
  it("accepts a workspace the editor itself would produce", () => {
    expect(coerceOslfWorkspaceState(validState())).not.toBeNull();
  });

  it("accepts an empty workspace", () => {
    // Saving an untouched editor is ordinary, and rejecting it would make a
    // blank query unloadable.
    expect(coerceOslfWorkspaceState(validState({ blocks: [] }))).not.toBeNull();
  });

  it("returns the same object rather than a copy", () => {
    const state = validState();

    // It is a gate, not a transformer: Blockly receives exactly what was
    // stored, so nothing is silently normalized on the way through.
    expect(coerceOslfWorkspaceState(state)).toBe(state);
  });

  it("keeps fields and nested inputs untouched", () => {
    const state = {
      blocks: {
        blocks: [
          {
            fields: { NAME: "x" },
            id: "b1",
            inputs: { CHANNEL: { block: { id: "b2", type: "name_var" } } },
            type: "proc_output",
          },
        ],
        languageVersion: 0,
      },
    };

    expect(coerceOslfWorkspaceState(state)).toBe(state);
  });
});

describe("refusing", () => {
  it("refuses null", () => {
    expect(coerceOslfWorkspaceState(null)).toBeNull();
  });

  it("refuses a document with no blocks section", () => {
    expect(coerceOslfWorkspaceState({})).toBeNull();
  });

  it("refuses a blocks section that is not an object", () => {
    expect(coerceOslfWorkspaceState({ blocks: "everything" })).toBeNull();
  });

  it("refuses a missing language version", () => {
    // Blockly uses this to decide how to read the rest; absent, it cannot.
    expect(coerceOslfWorkspaceState({ blocks: { blocks: [] } })).toBeNull();
  });

  it("refuses a language version that is not a number", () => {
    expect(
      coerceOslfWorkspaceState({
        blocks: { blocks: [], languageVersion: "0" },
      }),
    ).toBeNull();
  });

  it("refuses a block list that is not an array", () => {
    expect(
      coerceOslfWorkspaceState({
        blocks: { blocks: { b1: {} }, languageVersion: 0 },
      }),
    ).toBeNull();
  });
});

describe("totality", () => {
  it("never throws, whatever it is given", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        // The input is whatever the chain returned, so throwing here would put
        // the failure inside the loader rather than in a null the caller can
        // act on. Anything unrecognised must come back as null.
        const result = coerceOslfWorkspaceState(value as object | null);
        expect(result === null || typeof result === "object").toBe(true);
      }),
    );
  });

  it("accepts nothing that lacks the two structural requirements", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const blocks = (value as { blocks?: unknown } | null)?.blocks;
        const wellFormed =
          typeof blocks === "object" &&
          blocks !== null &&
          typeof (blocks as { languageVersion?: unknown }).languageVersion ===
            "number" &&
          Array.isArray((blocks as { blocks?: unknown }).blocks);

        // The exact rule, stated once: a value is loadable if and only if it
        // carries a numeric language version and an array of blocks.
        expect(coerceOslfWorkspaceState(value as object | null) !== null).toBe(
          wellFormed,
        );
      }),
    );
  });
});
