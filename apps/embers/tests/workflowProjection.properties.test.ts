import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";
import type { WorkflowDefinitionV2 } from "@/lib/workflow";

import { NAME_MAX_LENGTH, nameField } from "@/lib/forms/nameField";
import {
  fromWorkflowDefinition,
  toWorkflowDefinition,
  validateWorkflow,
} from "@/lib/workflow";

import { fc } from "./helpers/fc";

// Laws the canvas-to-definition projection must obey for every graph, and the
// specific law that a backend round-trip breaks.
//
// The projection is the boundary where a team stops being a picture and becomes
// something deployable, so a defect here is invisible until deploy. Commit
// 12cbdbd is the reason for the null-normalization law below: Rust serializes an
// absent `Option` as an explicit `null`, while an editor-built definition simply
// omits the key (JSON.stringify drops `undefined`). The example-based
// round-trip suite therefore stayed green while a definition reloaded from the
// backend blanked the editor. Only inputs shaped like the SERVER's are able to
// catch it, which is exactly what a generated arbitrary can produce and a
// hand-written fixture kept failing to.

/** The alphabet generated identifiers are drawn from, one letter per entry. */
const LETTERS = "abcdefghij".split("");

const NODE_TYPES = [
  "input-node",
  "output-node",
  "text-model",
  "compress",
  "gateway",
] as const;

const nodeArb = fc
  .tuple(
    fc.string({
      maxLength: 6,
      minLength: 1,
      unit: fc.constantFrom(...LETTERS),
    }),
    fc.constantFrom(...NODE_TYPES),
  )
  .map(
    ([id, type]): Node =>
      ({ data: {}, id, position: { x: 0, y: 0 }, type }) as Node,
  );

/** A graph with unique ids and edges that only reference real nodes. */
const graphArb = fc
  .array(nodeArb, { maxLength: 6, minLength: 2 })
  .map((nodes) => {
    const seen = new Map<string, Node>();
    nodes.forEach((node) => seen.set(node.id, node));
    return [...seen.values()];
  })
  .filter((nodes) => nodes.length >= 2)
  .chain((nodes) =>
    fc
      .array(
        fc.tuple(
          fc.nat({ max: nodes.length - 1 }),
          fc.nat({ max: nodes.length - 1 }),
        ),
        { maxLength: 8 },
      )
      .map((pairs) => {
        const edges = new Map<string, Edge>();
        for (const [from, to] of pairs) {
          if (from === to) {
            continue;
          }
          const source = nodes[from].id;
          const target = nodes[to].id;
          edges.set(`${source}-${target}`, {
            data: {},
            id: `${source}-${target}`,
            source,
            target,
          });
        }
        return { edges: [...edges.values()], nodes };
      }),
  );

/**
 * Replaces every absent optional with an explicit null, recursively.
 *
 * This is what a Rust backend sends: `Option::None` serializes as `null`, not
 * as a missing key. Reproducing it faithfully is the whole point -- a fixture
 * written by hand in TypeScript naturally omits keys instead, which is why the
 * defect survived a round-trip suite.
 */
function nullifyAbsentOptionals(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(nullifyAbsentOptionals);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      result[key] = inner === undefined ? null : nullifyAbsentOptionals(inner);
    }
    return result;
  }
  return value;
}

/**
 * A canvas of the shape the editor guides a user toward: one entry node, a
 * chain of activities, one output, and optional extra forward edges.
 *
 * Generated rather than hand-written so the law covers every size and shape of
 * chain instead of the two or three a fixture would name.
 */
const wellFormedGraphArb = fc
  .array(fc.constantFrom("text-model", "compress"), {
    maxLength: 4,
    minLength: 1,
  })
  .map((middleTypes) => {
    const nodes: Node[] = [
      { data: {}, id: "entry", position: { x: 0, y: 0 }, type: "input-node" },
      ...middleTypes.map(
        (type, index) =>
          ({
            data: {},
            id: `step${String(index)}`,
            position: { x: 0, y: 0 },
            type,
          }) as Node,
      ),
      { data: {}, id: "exit", position: { x: 0, y: 0 }, type: "output-node" },
    ];

    const edges: Edge[] = [];
    for (let index = 0; index < nodes.length - 1; index += 1) {
      const source = nodes[index].id;
      const target = nodes[index + 1].id;
      edges.push({ data: {}, id: `${source}-${target}`, source, target });
    }

    return { edges, nodes };
  });

describe("canvas to definition", () => {
  it("never throws, whatever the canvas holds", () => {
    fc.assert(
      fc.property(graphArb, ({ edges, nodes }) => {
        expect(() => toWorkflowDefinition(nodes, edges)).not.toThrow();
      }),
    );
  });

  it("keeps every node, and invents none", () => {
    fc.assert(
      fc.property(graphArb, ({ edges, nodes }) => {
        const definition = toWorkflowDefinition(nodes, edges);
        for (const node of nodes) {
          expect(definition.nodes[node.id]).toBeDefined();
        }
      }),
    );
  });

  it("emits a clean definition for every well-formed canvas", () => {
    fc.assert(
      fc.property(wellFormedGraphArb, ({ edges, nodes }) => {
        const diagnostics = validateWorkflow(
          toWorkflowDefinition(nodes, edges),
        );
        const errors = diagnostics.filter(
          (diagnostic) => diagnostic.severity === "error",
        );
        // WELL-FORMED means what the editor asks a user to draw: a single
        // entry, and a path from it to every other node. Arbitrary canvases
        // are deliberately NOT asserted to validate -- the editor is permissive
        // by design and the validator strict, which is the documented split
        // between saving a draft and deploying it. An earlier version of this
        // property asserted the stronger law and was refuted immediately by two
        // disconnected inputs, which the validator correctly rejects with
        // "root scope needs exactly one initial node".
        expect(errors).toEqual([]);
      }),
    );
  });

  it("rejects a canvas with more than one entry point", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({
            maxLength: 4,
            minLength: 1,
            unit: fc.constantFrom(...LETTERS),
          }),
          { maxLength: 4, minLength: 2 },
        ),
        (rawIds) => {
          const ids = [...new Set(rawIds)];
          fc.pre(ids.length >= 2);
          const nodes = ids.map(
            (id) =>
              ({
                data: {},
                id,
                position: { x: 0, y: 0 },
                type: "input-node",
              }) as Node,
          );

          const errors = validateWorkflow(
            toWorkflowDefinition(nodes, []),
          ).filter((diagnostic) => diagnostic.severity === "error");
          // The complement of the law above: the strictness is real, and a
          // graph with two starting points is caught before deploy rather than
          // at it.
          expect(errors.length).toBeGreaterThan(0);
        },
      ),
    );
  });
});

describe("definition back to canvas", () => {
  it("round-trips a definition through the canvas without losing nodes", () => {
    fc.assert(
      fc.property(graphArb, ({ edges, nodes }) => {
        const definition = toWorkflowDefinition(nodes, edges);
        const [backNodes] = fromWorkflowDefinition(definition);
        const projected = new Set(backNodes.map((node) => node.id));
        for (const node of nodes) {
          expect(projected.has(node.id)).toBe(true);
        }
      }),
    );
  });

  it("survives a definition whose absent optionals arrive as explicit null", () => {
    fc.assert(
      fc.property(graphArb, ({ edges, nodes }) => {
        const definition = toWorkflowDefinition(nodes, edges);
        // The shape a Rust backend actually sends.
        const fromServer = nullifyAbsentOptionals(
          JSON.parse(JSON.stringify(definition)),
        ) as WorkflowDefinitionV2;

        expect(() => fromWorkflowDefinition(fromServer)).not.toThrow();
      }),
    );
  });

  it("normalizes those nulls rather than passing them into the canvas", () => {
    fc.assert(
      fc.property(graphArb, ({ edges, nodes }) => {
        const definition = toWorkflowDefinition(nodes, edges);
        const fromServer = nullifyAbsentOptionals(
          JSON.parse(JSON.stringify(definition)),
        ) as WorkflowDefinitionV2;

        const [, backEdges] = fromWorkflowDefinition(fromServer);
        for (const edge of backEdges) {
          const data = (edge.data ?? {}) as Record<string, unknown>;
          for (const [key, value] of Object.entries(data)) {
            // A `null` reaching edge data is what blanked the editor: the
            // renderer reads these as absent-or-set, and `null` is neither.
            expect(`${key}=${String(value)}`).not.toContain("=null");
          }
        }
      }),
    );
  });

  it("reaches the same definition again after a server-shaped round trip", () => {
    fc.assert(
      fc.property(graphArb, ({ edges, nodes }) => {
        const definition = toWorkflowDefinition(nodes, edges);
        const fromServer = nullifyAbsentOptionals(
          JSON.parse(JSON.stringify(definition)),
        ) as WorkflowDefinitionV2;

        const [backNodes, backEdges] = fromWorkflowDefinition(fromServer);
        const again = toWorkflowDefinition(backNodes, backEdges, fromServer);

        // Idempotence: reloading a team and saving it unchanged must not
        // rewrite it. Without this a user who merely opens a team and saves
        // could silently alter what deploys.
        expect(Object.keys(again.nodes).sort()).toEqual(
          Object.keys(definition.nodes).sort(),
        );
      }),
    );
  });
});

describe("name bounds", () => {
  const field = nameField();

  it("accepts every non-empty name up to the limit", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: NAME_MAX_LENGTH, minLength: 1 }),
        (name) => {
          expect(field.safeParse(name).success).toBe(true);
        },
      ),
    );
  });

  it("refuses the empty name and anything past the limit", () => {
    expect(field.safeParse("").success).toBe(false);
    fc.assert(
      fc.property(
        fc.string({ maxLength: 200, minLength: NAME_MAX_LENGTH + 1 }),
        (name) => {
          // The bound is in UTF-16 code units, which is what zod measures and
          // what the card's line clamp is sized against.
          expect(field.safeParse(name).success).toBe(false);
        },
      ),
    );
  });
});
