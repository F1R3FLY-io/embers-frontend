import { WalletEvent } from "@/services/EmbersEvents";

import { fc } from "./helpers/fc";

// What the finalization event parser accepts and refuses.
//
// This schema sits between an untrusted socket frame and the decision to tell a
// user their work was saved. It has to be total in its failure -- either a
// fully typed event or a throw, never a half-parsed object -- because a
// partially trusted frame is how a client acts on a field the server did not
// send.

/** The alphabet a deploy id is drawn from, one character per entry. */
const HEX_DIGITS = "0123456789abcdef".split("");

/** A frame in the shape the server actually sends: `cost` is a string. */
const validFrameArb = fc.record({
  cost: fc.bigInt({ max: 2n ** 63n, min: 0n }).map(String),
  deploy_id: fc.string({
    maxLength: 144,
    minLength: 2,
    unit: fc.constantFrom(...HEX_DIGITS),
  }),
  errored: fc.boolean(),
  node_type: fc.constantFrom("Observer", "Validator"),
  type: fc.constant("Finalized"),
});

describe("accepting", () => {
  it("parses every well-formed frame", () => {
    fc.assert(
      fc.property(validFrameArb, (frame) => {
        expect(() => WalletEvent.parse(frame)).not.toThrow();
      }),
    );
  });

  it("coerces the wire's string cost to a bigint without loss", () => {
    fc.assert(
      fc.property(validFrameArb, (frame) => {
        // The wire uses a string because the value can exceed what a JS number
        // holds exactly; parsing to `number` would silently round it.
        expect(WalletEvent.parse(frame).cost).toBe(BigInt(frame.cost));
      }),
    );
  });

  it("preserves every other field exactly", () => {
    fc.assert(
      fc.property(validFrameArb, (frame) => {
        const parsed = WalletEvent.parse(frame);
        expect(parsed.deploy_id).toBe(frame.deploy_id);
        expect(parsed.errored).toBe(frame.errored);
        expect(parsed.node_type).toBe(frame.node_type);
      }),
    );
  });

  it("tolerates unknown fields a newer server might add", () => {
    fc.assert(
      fc.property(validFrameArb, fc.string(), (frame, extra) => {
        fc.pre(!(extra in frame));
        // Forward compatibility: a server that starts sending an additional
        // field must not break every client that has not been updated.
        expect(() =>
          WalletEvent.parse({ ...frame, [extra]: "anything" }),
        ).not.toThrow();
      }),
    );
  });
});

describe("refusing", () => {
  const requiredFields = [
    "cost",
    "deploy_id",
    "errored",
    "node_type",
    "type",
  ] as const;

  it("refuses a frame with any required field missing", () => {
    fc.assert(
      fc.property(
        validFrameArb,
        fc.constantFrom(...requiredFields),
        (frame, dropped) => {
          // Rebuilt without the dropped key rather than deleted from a
          // copy: the effect is the same and it does not depend on `delete`
          // over a computed key.
          const partial = Object.fromEntries(
            Object.entries(frame).filter(([key]) => key !== dropped),
          );
          expect(() => WalletEvent.parse(partial)).toThrow();
        },
      ),
    );
  });

  it("refuses a frame with any required field nulled", () => {
    fc.assert(
      fc.property(
        validFrameArb,
        fc.constantFrom(...requiredFields),
        (frame, nulled) => {
          expect(() =>
            WalletEvent.parse({ ...frame, [nulled]: null }),
          ).toThrow();
        },
      ),
    );
  });

  it("refuses an unknown node type", () => {
    fc.assert(
      fc.property(validFrameArb, fc.string(), (frame, nodeType) => {
        fc.pre(nodeType !== "Observer" && nodeType !== "Validator");
        expect(() =>
          WalletEvent.parse({ ...frame, node_type: nodeType }),
        ).toThrow();
      }),
    );
  });

  it("refuses an unknown event type", () => {
    fc.assert(
      fc.property(validFrameArb, fc.string(), (frame, type) => {
        fc.pre(type !== "Finalized");
        // A one-member discriminated union: an event the client cannot
        // interpret is a hard failure rather than a silent no-op, which is the
        // safer default -- dropping an unrecognised event is how a client waits
        // forever for something that already happened.
        expect(() => WalletEvent.parse({ ...frame, type })).toThrow();
      }),
    );
  });

  it("refuses exactly the costs that cannot be read as an integer", () => {
    fc.assert(
      fc.property(validFrameArb, fc.string(), (frame, cost) => {
        // The honest law: the schema coerces, so it accepts precisely what
        // `BigInt` accepts and refuses precisely what it refuses. Asserting
        // anything narrower would be asserting a rule the code does not have.
        let coercible = true;
        try {
          BigInt(cost);
        } catch {
          coercible = false;
        }

        // Whether the schema threw is measured first and asserted once. Two
        // `expect` calls in opposite branches read as a conditional
        // assertion, which is the shape that hides a property asserting
        // nothing at all on the path it actually takes.
        let rejected = false;
        try {
          WalletEvent.parse({ ...frame, cost });
        } catch {
          rejected = true;
        }

        expect(rejected).toBe(!coercible);
      }),
    );
  });

  it("reads an empty or blank cost as zero rather than rejecting it", () => {
    // PINNED, NOT ENDORSED, and found by the property above rather than by
    // reading the code. `BigInt("")` is `0n`, so a coercing schema treats a
    // missing-but-present cost as a free deploy. The consequence is small --
    // cost is informational, shown in the dock, never used for a decision --
    // which is why this records the behavior instead of changing it. If cost
    // ever gains a decision-making role, this test is the place that says the
    // coercion has to be tightened first.
    for (const cost of ["", " ", "\n"]) {
      expect(
        WalletEvent.parse({
          cost,
          deploy_id: "ab",
          errored: false,
          node_type: "Observer",
          type: "Finalized",
        }).cost,
      ).toBe(0n);
    }
  });

  it("refuses anything that is not an object", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.anything()),
        ),
        (value) => {
          expect(() => WalletEvent.parse(value)).toThrow();
        },
      ),
    );
  });
});
