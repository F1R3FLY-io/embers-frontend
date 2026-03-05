/**
 * @file financial-combinators.test.ts
 *
 * Tests for SP-J combinator code-gen, node registry, and graph compiler.
 */

import * as rho from "../src/codegen";
import { SPJ_NODE_REGISTRY } from "../src/registry";
import { compileGraph } from "../src/compiler";
import type { CanvasGraph } from "../src/compiler";

// ────────────────────────────────────────────────────────────
// Code-gen smoke tests – check rholang is non-empty and
// contains the key structural markers we expect.
// ────────────────────────────────────────────────────────────

describe("codegen – primitives", () => {
  test("zero() emits a contract that calls result!(true)", () => {
    const src = rho.zero();
    expect(src).toContain("result!(true)");
    expect(src).toContain("zeroCh");
  });

  test("one() names the currency in the payment oracle call", () => {
    const src = rho.one("USD");
    expect(src).toContain('"USD"');
    expect(src).toContain("paymentOracle");
  });

  test("give() swaps holder ↔ cp", () => {
    const src = rho.give(rho.zero());
    expect(src).toContain("subCh!(cp, holder, result)");
  });

  test("and() joins both results with &&", () => {
    const src = rho.and(rho.zero(), rho.zero());
    expect(src).toContain("l && r");
    expect(src).toContain("for(l <- leftDone; r <- rightDone)");
  });

  test("or() offers a choice channel to holder", () => {
    const src = rho.or(rho.zero(), rho.zero());
    expect(src).toContain("choiceCh");
    expect(src).toContain('"left"');
    expect(src).toContain('"right"');
  });

  test("scale() reads observable then wraps holder", () => {
    const src = rho.scale("myObs", rho.one("REV"));
    expect(src).toContain('"read"');
    expect(src).toContain("myObs");
    expect(src).toContain("v * amount");
  });

  test("when() polls until condition is true", () => {
    const src = rho.when("dateCh", rho.one("ETH"));
    expect(src).toContain("pollCh");
    expect(src).toContain("if(cond)");
  });

  test("until() races sub completion against condition", () => {
    const src = rho.until("dateCh", rho.one("USD"));
    expect(src).toContain("untilCh");
    expect(src).toContain("result!(false)");
  });
});

describe("codegen – observables", () => {
  test("constObs returns the literal value", () => {
    expect(rho.constObs(42)).toContain("ret!(42)");
  });

  test("spotObs calls priceFeed oracle", () => {
    const src = rho.spotObs("ETH/USD");
    expect(src).toContain("priceFeed");
    expect(src).toContain('"ETH/USD"');
  });

  test("dateObs compares blocktime to ISO string", () => {
    const src = rho.dateObs("2026-12-31");
    expect(src).toContain("blocktime");
    expect(src).toContain('"2026-12-31"');
  });

  test("rateObs queries rateOracle", () => {
    const src = rho.rateObs("SOFR");
    expect(src).toContain("rateOracle");
    expect(src).toContain('"SOFR"');
  });
});

// ────────────────────────────────────────────────────────────
// Registry tests
// ────────────────────────────────────────────────────────────

describe("SPJ_NODE_REGISTRY", () => {
  const ids = Object.keys(SPJ_NODE_REGISTRY);

  test("contains all 10 primitive combinators", () => {
    const primitives = [
      "spj.zero","spj.one","spj.give","spj.and","spj.or",
      "spj.scale","spj.when","spj.anytime","spj.until","spj.get",
    ];
    for (const id of primitives) {
      expect(ids).toContain(id);
    }
  });

  test("contains 4 observable nodes", () => {
    const obs = ids.filter(id => id.startsWith("spj.obs."));
    expect(obs).toHaveLength(4);
  });

  test("contains 6 instrument nodes", () => {
    const instruments = ids.filter(id => id.startsWith("instrument."));
    expect(instruments).toHaveLength(6);
  });

  test("every node has a non-empty toRholang", () => {
    for (const [id, def] of Object.entries(SPJ_NODE_REGISTRY)) {
      const src = def.toRholang(def.defaultParams, {});
      expect(typeof src).toBe("string");
      expect(src.length).toBeGreaterThan(10);
    }
  });

  test("ZCB instrument uses when + scale + one", () => {
    const zcb = SPJ_NODE_REGISTRY["instrument.zcb"];
    const src = zcb.toRholang(zcb.defaultParams, {});
    expect(src).toContain("whenCh");
    expect(src).toContain("scaleCh");
    expect(src).toContain('"USD"');
  });

  test("IRS instrument uses and + give + scale", () => {
    const irs = SPJ_NODE_REGISTRY["instrument.irs"];
    const src = irs.toRholang(irs.defaultParams, {});
    expect(src).toContain("andCh");
    expect(src).toContain("giveCh");
    expect(src).toContain("scaleCh");
  });
});

// ────────────────────────────────────────────────────────────
// Compiler tests
// ────────────────────────────────────────────────────────────

describe("compileGraph", () => {
  test("single zero node compiles to a valid root", () => {
    const graph: CanvasGraph = {
      nodes: {
        n1: { instanceId: "n1", definitionId: "spj.zero", params: {} },
      },
      edges: [],
    };
    const result = compileGraph(graph);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.roots).toEqual(["n1"]);
      expect(result.rholang).toContain("zeroCh");
    }
  });

  test("scale(const(5), one('REV')) wires correctly", () => {
    const graph: CanvasGraph = {
      nodes: {
        obs: { instanceId: "obs", definitionId: "spj.obs.const", params: { value: 5 } },
        pay: { instanceId: "pay", definitionId: "spj.one",       params: { currency: "REV" } },
        sc:  { instanceId: "sc",  definitionId: "spj.scale",     params: {} },
      },
      edges: [
        { fromNodeId: "obs", fromPortId: "obs", toNodeId: "sc", toPortId: "obs" },
        { fromNodeId: "pay", fromPortId: "contract", toNodeId: "sc", toPortId: "sub" },
      ],
    };
    const result = compileGraph(graph);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.roots).toEqual(["sc"]);
      expect(result.rholang).toContain("scaleCh");
      expect(result.rholang).toContain('"REV"');
    }
  });

  test("cycle detection returns error", () => {
    const graph: CanvasGraph = {
      nodes: {
        a: { instanceId: "a", definitionId: "spj.give", params: {} },
        b: { instanceId: "b", definitionId: "spj.give", params: {} },
      },
      edges: [
        { fromNodeId: "a", fromPortId: "contract", toNodeId: "b", toPortId: "sub" },
        { fromNodeId: "b", fromPortId: "contract", toNodeId: "a", toPortId: "sub" },
      ],
    };
    const result = compileGraph(graph);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/cycle/i);
  });

  test("unknown definitionId returns error", () => {
    const graph: CanvasGraph = {
      nodes: {
        x: { instanceId: "x", definitionId: "notanode", params: {} },
      },
      edges: [],
    };
    const result = compileGraph(graph);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/notanode/);
  });

  test("ZCB instrument node compiles standalone", () => {
    const graph: CanvasGraph = {
      nodes: {
        bond: {
          instanceId: "bond",
          definitionId: "instrument.zcb",
          params: { notional: 10000, currency: "USD", maturity: "2027-01-01" },
        },
      },
      edges: [],
    };
    const result = compileGraph(graph);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rholang).toContain('"USD"');
      expect(result.rholang).toContain('"2027-01-01"');
    }
  });

  test("multi-root graph wraps roots with |", () => {
    const graph: CanvasGraph = {
      nodes: {
        a: { instanceId: "a", definitionId: "spj.zero", params: {} },
        b: { instanceId: "b", definitionId: "spj.zero", params: {} },
      },
      edges: [],
    };
    const result = compileGraph(graph);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.roots).toHaveLength(2);
      expect(result.rholang).toContain("\n|\n");
    }
  });
});
