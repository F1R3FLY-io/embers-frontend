import { RhoLangGenerator } from "@/generator";

import { fc } from "./helpers/fc";

// Laws the Rholang generator must obey for every block definition and every
// field value, rather than for the handful the example suite names.
//
// The generator turns a picture into source that will be deployed to a chain.
// A template that silently drops a substitution, or leaves a `%1` marker in the
// output, produces Rholang that is syntactically plausible and semantically
// wrong -- and the failure surfaces at deploy, or worse, at run time, far from
// the block that caused it.

/** A field value a user could plausibly type, including awkward ones. */
const fieldValueArb = fc.oneof(
  fc.string({ maxLength: 20 }),
  fc.constantFrom(
    "x",
    "%1",
    "%2",
    "100%",
    '"quoted"',
    "with space",
    "a\nb",
    "é中",
    "",
  ),
);

/** A definition with N field arguments and a template that references each. */
const definitionArb = fc
  .integer({ max: 4, min: 1 })
  .chain((count) =>
    fc.record({
      args: fc.constant(
        Array.from({ length: count }, (_unused, index) => ({
          name: `FIELD${String(index)}`,
          text: "",
          type: "field_input",
        })),
      ),
      order: fc.constant(count),
    }),
  )
  .map(({ args, order }) => ({
    args0: args,
    message0: Array.from(
      { length: order },
      (_unused, index) => `%${String(index + 1)}`,
    ).join(" then "),
    output: "Proc",
    type: "generated_block",
  }));

function generatorFor(definition: unknown) {
  const generator = new RhoLangGenerator();
  generator.registerBlockDefinitions([definition] as never);
  return generator;
}

function blockWith(values: Record<string, string>) {
  return {
    getFieldValue: (name: string) => values[name] ?? null,
    nextConnection: null,
    type: "generated_block",
    workspace: { getVariableById: () => undefined },
  } as never;
}

it("registers a handler for every definition it is given", () => {
  fc.assert(
    fc.property(definitionArb, (definition) => {
      const generator = generatorFor(definition);
      expect(generator.forBlock.generated_block).toBeDefined();
    }),
  );
});

it("substitutes every placeholder, leaving no marker behind", () => {
  fc.assert(
    fc.property(definitionArb, fieldValueArb, (definition, value) => {
      // A value that itself contains a marker would make this law contradict
      // itself: the marker in the OUTPUT would be the user's own text, not an
      // unsubstituted template. That case is the subject of the next property
      // instead. fast-check found it immediately, with the value "%1".
      fc.pre(!value.includes("%"));

      const generator = generatorFor(definition);
      const fields = Object.fromEntries(
        definition.args0.map((arg) => [arg.name, value]),
      );

      const [code] = generator.forBlock.generated_block(
        blockWith(fields),
        generator,
      ) as [string, number];

      // An unresolved `%1` in generated Rholang is not a cosmetic defect: it is
      // a syntax error the user never wrote and cannot locate from the block
      // they were editing.
      for (let index = 1; index <= definition.args0.length; index += 1) {
        expect(code).not.toContain(`%${String(index)}`);
      }
    }),
  );
});

it("inserts a marker-shaped value literally rather than substituting it again", () => {
  fc.assert(
    fc.property(definitionArb, (definition) => {
      const generator = generatorFor(definition);
      // Every field holds the text "%1". A single-pass substitution yields that
      // text once per placeholder; a generator that re-scanned its own output
      // would substitute the result again, and a template referring to itself
      // would not terminate.
      const fields = Object.fromEntries(
        definition.args0.map((arg) => [arg.name, "%1"]),
      );

      const [code] = generator.forBlock.generated_block(
        blockWith(fields),
        generator,
      ) as [string, number];

      const markers = code.match(/%1/g) ?? [];
      expect(markers).toHaveLength(definition.args0.length);
    }),
  );
});

it("places each field's value into the output", () => {
  fc.assert(
    fc.property(
      definitionArb,
      fc.string({ maxLength: 12, minLength: 1 }),
      (definition, value) => {
        // A value containing a `%` would make "the marker is gone" and "the
        // value is present" contradict each other; those cases are covered by
        // the substitution property above.
        fc.pre(!value.includes("%"));

        const generator = generatorFor(definition);
        const fields = Object.fromEntries(
          definition.args0.map((arg) => [arg.name, value]),
        );

        const [code] = generator.forBlock.generated_block(
          blockWith(fields),
          generator,
        ) as [string, number];

        expect(code).toContain(value);
      },
    ),
  );
});

it("generates the same code twice for the same input", () => {
  fc.assert(
    fc.property(definitionArb, fieldValueArb, (definition, value) => {
      const fields = Object.fromEntries(
        definition.args0.map((arg) => [arg.name, value]),
      );

      const first = generatorFor(definition).forBlock.generated_block(
        blockWith(fields),
        generatorFor(definition),
      ) as [string, number];
      const second = generatorFor(definition).forBlock.generated_block(
        blockWith(fields),
        generatorFor(definition),
      ) as [string, number];

      // Determinism is what makes a saved workspace and a redeployed team
      // agree: the same picture must always compile to the same contract.
      expect(first[0]).toBe(second[0]);
    }),
  );
});

it("never throws, whatever a field contains", () => {
  fc.assert(
    fc.property(definitionArb, fc.string(), (definition, value) => {
      const generator = generatorFor(definition);
      const fields = Object.fromEntries(
        definition.args0.map((arg) => [arg.name, value]),
      );

      expect(() =>
        generator.forBlock.generated_block(blockWith(fields), generator),
      ).not.toThrow();
    }),
  );
});

it("treats a missing field as empty rather than as the string null", () => {
  fc.assert(
    fc.property(definitionArb, (definition) => {
      const generator = generatorFor(definition);

      const [code] = generator.forBlock.generated_block(
        // No field values at all: `getFieldValue` answers null, which is what
        // a block reports for a field the user has not filled in.
        blockWith({}),
        generator,
      ) as [string, number];

      // "null" appearing in generated Rholang would be a JavaScript value
      // leaking into a contract.
      expect(code).not.toContain("null");
    }),
  );
});
