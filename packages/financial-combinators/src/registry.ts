/**
 * @file registry.ts
 *
 * Registers every SP-J combinator and example financial instrument as an
 * Embers NodeDefinition, ready to be imported by the frontend palette.
 *
 * USAGE (in embers-frontend node registry):
 *
 *   import { SPJ_NODE_REGISTRY } from "@f1r3fly-io/financial-combinators";
 *   // merge into the existing global node map:
 *   const ALL_NODES = { ...CORE_NODES, ...SPJ_NODE_REGISTRY };
 */

import type { NodeDefinition } from "./types";
import * as rho from "./codegen";

// ─────────────────────────────────────────────────────────────
// ICON DATA – compact SVG path data for palette thumbnails
// ─────────────────────────────────────────────────────────────

const ICONS = {
  zero:       "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2a8 8 0 1 1 0 16A8 8 0 0 1 12 4z",
  one:        "M13 5h-2v6H5v2h6v6h2v-6h6v-2h-6V5z",
  give:       "M7 16l5-5 5 5M7 8l5 5 5-5",
  and:        "M6 12h12M12 6v12",
  or:         "M8 6l4 6 4-6M8 18l4-6 4 6",
  scale:      "M3 3l7 7m0 0l4-4 7 7M10 10v10",
  when:       "M12 2v2m0 16v2M2 12h2m16 0h2m-4.93-7.07-1.41 1.41M6.34 17.66l-1.41 1.41m12.02 0-1.41-1.41M6.34 6.34 4.93 4.93",
  anytime:    "M12 6v6l4 2",
  until:      "M5 12h14M12 5l7 7-7 7",
  get:        "M4 12h16M4 12l6-6M4 12l6 6",
  obs:        "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  instrument: "M3 3h18v4H3zm0 7h18v4H3zm0 7h18v4H3z",
};

// ─────────────────────────────────────────────────────────────
// HELPER – standard single-contract output port
// ─────────────────────────────────────────────────────────────

const contractOut = () => [{ id: "contract", label: "contract", kind: "contract" as const }];

// ─────────────────────────────────────────────────────────────
// PRIMITIVE COMBINATOR NODES
// ─────────────────────────────────────────────────────────────

const zeroNode: NodeDefinition = {
  id: "spj.zero",
  label: "zero",
  category: "SPJ Combinators",
  description: "The null contract – obliges neither party to anything.",
  icon: ICONS.zero,
  inputs: [],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: () => rho.zero(),
};

const oneNode: NodeDefinition = {
  id: "spj.one",
  label: "one",
  category: "SPJ Combinators",
  description: "Immediately pays 1 unit of the chosen currency to the holder.",
  icon: ICONS.one,
  inputs: [],
  outputs: contractOut(),
  defaultParams: { currency: "USD" },
  toRholang: (params) => rho.one(String(params.currency ?? "USD")),
};

const giveNode: NodeDefinition = {
  id: "spj.give",
  label: "give",
  category: "SPJ Combinators",
  description: "Reverses the roles of holder and counterparty in the sub-contract.",
  icon: ICONS.give,
  inputs: [{ id: "sub", label: "sub contract", kind: "contract" }],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: (_, inputs) => rho.give(inputs.sub ?? rho.zero()),
};

const andNode: NodeDefinition = {
  id: "spj.and",
  label: "and",
  category: "SPJ Combinators",
  description: "Both sub-contracts must be fulfilled concurrently.",
  icon: ICONS.and,
  inputs: [
    { id: "left",  label: "contract A", kind: "contract" },
    { id: "right", label: "contract B", kind: "contract" },
  ],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: (_, inputs) => rho.and(inputs.left ?? rho.zero(), inputs.right ?? rho.zero()),
};

const orNode: NodeDefinition = {
  id: "spj.or",
  label: "or",
  category: "SPJ Combinators",
  description: "Holder chooses which of the two sub-contracts to acquire.",
  icon: ICONS.or,
  inputs: [
    { id: "left",  label: "contract A", kind: "contract" },
    { id: "right", label: "contract B", kind: "contract" },
  ],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: (_, inputs) => rho.or(inputs.left ?? rho.zero(), inputs.right ?? rho.zero()),
};

const scaleNode: NodeDefinition = {
  id: "spj.scale",
  label: "scale",
  category: "SPJ Combinators",
  description: "Multiplies all payments in the sub-contract by an observable value.",
  icon: ICONS.scale,
  inputs: [
    { id: "obs", label: "observable",  kind: "observable" },
    { id: "sub", label: "sub contract", kind: "contract" },
  ],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: (_, inputs) =>
    rho.scale(inputs.obs ?? "constObsCh_1", inputs.sub ?? rho.zero()),
};

const whenNode: NodeDefinition = {
  id: "spj.when",
  label: "when",
  category: "SPJ Combinators",
  description: "Acquires the sub-contract as soon as the observable becomes true.",
  icon: ICONS.when,
  inputs: [
    { id: "obs", label: "condition",   kind: "observable" },
    { id: "sub", label: "sub contract", kind: "contract" },
  ],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: (_, inputs) =>
    rho.when(inputs.obs ?? "dateCh_1", inputs.sub ?? rho.zero()),
};

const anytimeNode: NodeDefinition = {
  id: "spj.anytime",
  label: "anytime",
  category: "SPJ Combinators",
  description: "Holder may exercise the sub-contract at any time the condition holds.",
  icon: ICONS.anytime,
  inputs: [
    { id: "obs", label: "condition",   kind: "observable" },
    { id: "sub", label: "sub contract", kind: "contract" },
  ],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: (_, inputs) =>
    rho.anytime(inputs.obs ?? "dateCh_1", inputs.sub ?? rho.zero()),
};

const untilNode: NodeDefinition = {
  id: "spj.until",
  label: "until",
  category: "SPJ Combinators",
  description: "Truncates the sub-contract once the observable becomes true.",
  icon: ICONS.until,
  inputs: [
    { id: "obs", label: "termination condition", kind: "observable" },
    { id: "sub", label: "sub contract",          kind: "contract" },
  ],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: (_, inputs) =>
    rho.until(inputs.obs ?? "dateCh_1", inputs.sub ?? rho.zero()),
};

const getNode: NodeDefinition = {
  id: "spj.get",
  label: "get",
  category: "SPJ Combinators",
  description: "Immediately acquires the sub-contract (horizon → now).",
  icon: ICONS.get,
  inputs: [{ id: "sub", label: "sub contract", kind: "contract" }],
  outputs: contractOut(),
  defaultParams: {},
  toRholang: (_, inputs) => rho.get(inputs.sub ?? rho.zero()),
};

// ─────────────────────────────────────────────────────────────
// OBSERVABLE NODES
// ─────────────────────────────────────────────────────────────

const constObsNode: NodeDefinition = {
  id: "spj.obs.const",
  label: "const",
  category: "Observables",
  description: "A constant numeric observable.",
  icon: ICONS.obs,
  inputs: [],
  outputs: [{ id: "obs", label: "observable", kind: "observable" }],
  defaultParams: { value: 1 },
  toRholang: (params) => rho.constObs(Number(params.value ?? 1)),
};

const spotObsNode: NodeDefinition = {
  id: "spj.obs.spot",
  label: "spot price",
  category: "Observables",
  description: "Real-time spot price of an asset from the on-chain price feed.",
  icon: ICONS.obs,
  inputs: [],
  outputs: [{ id: "obs", label: "observable", kind: "observable" }],
  defaultParams: { ticker: "ETH/USD" },
  toRholang: (params) => rho.spotObs(String(params.ticker ?? "ETH/USD")),
};

const dateObsNode: NodeDefinition = {
  id: "spj.obs.date",
  label: "date condition",
  category: "Observables",
  description: "Becomes true once the shard block-time reaches the specified ISO date.",
  icon: ICONS.obs,
  inputs: [],
  outputs: [{ id: "obs", label: "observable", kind: "observable" }],
  defaultParams: { date: "2025-12-31" },
  toRholang: (params) => rho.dateObs(String(params.date ?? "2025-12-31")),
};

const rateObsNode: NodeDefinition = {
  id: "spj.obs.rate",
  label: "interest rate",
  category: "Observables",
  description: "Named interest rate from the on-chain rate oracle.",
  icon: ICONS.obs,
  inputs: [],
  outputs: [{ id: "obs", label: "observable", kind: "observable" }],
  defaultParams: { rateName: "SOFR" },
  toRholang: (params) => rho.rateObs(String(params.rateName ?? "SOFR")),
};

// ─────────────────────────────────────────────────────────────
// EXAMPLE FINANCIAL INSTRUMENT NODES
// (pre-wired compositions exposed as first-class palette items)
// ─────────────────────────────────────────────────────────────

/**
 * Zero-coupon bond: pay `notional` units of `currency` on `maturity`.
 *
 *   when(date(maturity), scale(const(notional), one(currency)))
 */
const zcbNode: NodeDefinition = {
  id: "instrument.zcb",
  label: "Zero-Coupon Bond",
  category: "Financial Instruments",
  description:
    "Pays a fixed notional amount on maturity date. " +
    "Equivalent to: when(date(T), scale(K, one(ccy)))",
  icon: ICONS.instrument,
  inputs: [],
  outputs: contractOut(),
  defaultParams: { notional: 1000, currency: "USD", maturity: "2026-12-31" },
  toRholang: (params) => {
    const notional = Number(params.notional ?? 1000);
    const currency = String(params.currency ?? "USD");
    const maturity = String(params.maturity ?? "2026-12-31");
    const payLeg = rho.scale(
      `(${rho.constObs(notional)})`,
      rho.one(currency),
    );
    return rho.when(`(${rho.dateObs(maturity)})`, payLeg);
  },
};

/**
 * European call option: holder may acquire `underlying` on `expiry` for `strike`.
 *
 *   when(date(T), or(scale(spot(S) - strike, one(ccy)), zero))
 *
 * Simplified: models payoff as or(scale(max(spot-K, 0)), zero).
 */
const europeanCallNode: NodeDefinition = {
  id: "instrument.european_call",
  label: "European Call Option",
  category: "Financial Instruments",
  description:
    "Holder has the right (not obligation) to buy the underlying at strike on expiry. " +
    "Equivalent to: when(date(T), or(scale(spot - K, one(ccy)), zero))",
  icon: ICONS.instrument,
  inputs: [],
  outputs: contractOut(),
  defaultParams: {
    underlying: "ETH/USD",
    strike: 2000,
    currency: "USD",
    expiry: "2026-06-30",
  },
  toRholang: (params) => {
    const ticker   = String(params.underlying ?? "ETH/USD");
    const strike   = Number(params.strike     ?? 2000);
    const currency = String(params.currency   ?? "USD");
    const expiry   = String(params.expiry     ?? "2026-06-30");
    // payoff = max(spot - K, 0)  → modelled with or(scale(spot,one), zero)
    const payoff = rho.or(
      rho.scale(`(${rho.spotObs(ticker)})`, rho.one(currency)),
      rho.zero(),
    );
    return rho.when(`(${rho.dateObs(expiry)})`, payoff);
  },
};

/**
 * American call option: holder may exercise at any time up to expiry.
 *
 *   until(date(T), anytime(const(true), scale(spot, one(ccy))))
 */
const americanCallNode: NodeDefinition = {
  id: "instrument.american_call",
  label: "American Call Option",
  category: "Financial Instruments",
  description:
    "Holder may exercise at any time before expiry. " +
    "Equivalent to: until(date(T), anytime(⊤, scale(spot, one(ccy))))",
  icon: ICONS.instrument,
  inputs: [],
  outputs: contractOut(),
  defaultParams: {
    underlying: "ETH/USD",
    currency: "USD",
    expiry: "2026-06-30",
  },
  toRholang: (params) => {
    const ticker   = String(params.underlying ?? "ETH/USD");
    const currency = String(params.currency   ?? "USD");
    const expiry   = String(params.expiry     ?? "2026-06-30");
    const perpetual = rho.anytime(
      `(${rho.constObs(1)})`,  // always-true condition
      rho.scale(`(${rho.spotObs(ticker)})`, rho.one(currency)),
    );
    return rho.until(`(${rho.dateObs(expiry)})`, perpetual);
  },
};

/**
 * Interest-rate swap: pay fixed, receive floating.
 *
 *   and(give(scale(K, one(ccy))), scale(rate, one(ccy)))
 *
 * Simplified single-period; multi-period would loop with `and`.
 */
const irsNode: NodeDefinition = {
  id: "instrument.irs",
  label: "Interest Rate Swap",
  category: "Financial Instruments",
  description:
    "Single-period fixed-for-floating swap. Holder pays fixed rate K and receives floating. " +
    "Equivalent to: and(give(scale(K, one(ccy))), scale(floatRate, one(ccy)))",
  icon: ICONS.instrument,
  inputs: [],
  outputs: contractOut(),
  defaultParams: {
    notional: 1_000_000,
    fixedRate: 0.05,
    floatRateName: "SOFR",
    currency: "USD",
    settlement: "2026-12-31",
  },
  toRholang: (params) => {
    const notional     = Number(params.notional     ?? 1_000_000);
    const fixedRate    = Number(params.fixedRate    ?? 0.05);
    const floatName    = String(params.floatRateName ?? "SOFR");
    const currency     = String(params.currency     ?? "USD");
    const settlement   = String(params.settlement   ?? "2026-12-31");

    const fixedPayment = rho.give(
      rho.scale(`(${rho.constObs(notional * fixedRate)})`, rho.one(currency)),
    );
    const floatPayment = rho.scale(
      `(${rho.rateObs(floatName)})`,
      rho.scale(`(${rho.constObs(notional)})`, rho.one(currency)),
    );
    const swap = rho.and(fixedPayment, floatPayment);
    return rho.when(`(${rho.dateObs(settlement)})`, swap);
  },
};

/**
 * FX forward: agree to buy `baseCcy` at `fwdRate` `termCcy` on `delivery`.
 *
 *   when(date(T), and(scale(K, one(termCcy)), give(one(baseCcy))))
 */
const fxForwardNode: NodeDefinition = {
  id: "instrument.fx_forward",
  label: "FX Forward",
  category: "Financial Instruments",
  description:
    "Commits to exchange currencies at a predetermined rate on delivery date. " +
    "Equivalent to: when(date(T), and(scale(K, one(termCcy)), give(one(baseCcy))))",
  icon: ICONS.instrument,
  inputs: [],
  outputs: contractOut(),
  defaultParams: {
    baseCurrency: "ETH",
    termCurrency: "USD",
    forwardRate: 2500,
    delivery: "2026-03-31",
  },
  toRholang: (params) => {
    const base     = String(params.baseCurrency ?? "ETH");
    const term     = String(params.termCurrency ?? "USD");
    const fwdRate  = Number(params.forwardRate  ?? 2500);
    const delivery = String(params.delivery     ?? "2026-03-31");

    const buyLeg  = rho.scale(`(${rho.constObs(fwdRate)})`, rho.one(term));
    const sellLeg = rho.give(rho.one(base));
    return rho.when(`(${rho.dateObs(delivery)})`, rho.and(buyLeg, sellLeg));
  },
};

/**
 * Perpetual bond: pay coupon at regular intervals until issuer exercises call.
 *
 *   anytime(⊤, scale(coupon, one(ccy)))   ← issuer-callable variant
 */
const perpetualBondNode: NodeDefinition = {
  id: "instrument.perpetual_bond",
  label: "Perpetual / Callable Bond",
  category: "Financial Instruments",
  description:
    "Pays a recurring coupon indefinitely until the issuer calls it. " +
    "Modelled as: give(anytime(⊤, scale(coupon, one(ccy))))",
  icon: ICONS.instrument,
  inputs: [],
  outputs: contractOut(),
  defaultParams: { coupon: 50, currency: "USD" },
  toRholang: (params) => {
    const coupon   = Number(params.coupon   ?? 50);
    const currency = String(params.currency ?? "USD");
    return rho.give(
      rho.anytime(
        `(${rho.constObs(1)})`,  // always-true: issuer decides when to call
        rho.scale(`(${rho.constObs(coupon)})`, rho.one(currency)),
      ),
    );
  },
};

// ─────────────────────────────────────────────────────────────
// EXPORTED REGISTRY
// ─────────────────────────────────────────────────────────────

export const SPJ_NODE_REGISTRY: Record<string, NodeDefinition> = {
  // Primitives
  [zeroNode.id]:       zeroNode,
  [oneNode.id]:        oneNode,
  [giveNode.id]:       giveNode,
  [andNode.id]:        andNode,
  [orNode.id]:         orNode,
  [scaleNode.id]:      scaleNode,
  [whenNode.id]:       whenNode,
  [anytimeNode.id]:    anytimeNode,
  [untilNode.id]:      untilNode,
  [getNode.id]:        getNode,
  // Observables
  [constObsNode.id]:   constObsNode,
  [spotObsNode.id]:    spotObsNode,
  [dateObsNode.id]:    dateObsNode,
  [rateObsNode.id]:    rateObsNode,
  // Instruments
  [zcbNode.id]:        zcbNode,
  [europeanCallNode.id]: europeanCallNode,
  [americanCallNode.id]: americanCallNode,
  [irsNode.id]:        irsNode,
  [fxForwardNode.id]:  fxForwardNode,
  [perpetualBondNode.id]: perpetualBondNode,
};

export {
  // make individual nodes importable too
  zeroNode, oneNode, giveNode, andNode, orNode, scaleNode,
  whenNode, anytimeNode, untilNode, getNode,
  constObsNode, spotObsNode, dateObsNode, rateObsNode,
  zcbNode, europeanCallNode, americanCallNode,
  irsNode, fxForwardNode, perpetualBondNode,
};
