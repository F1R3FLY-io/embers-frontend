import { Position } from "@xyflow/react";
import inputNodeIcon from "@/public/icons/input-node.png";
import defaultNodeIcon from "@/public/icons/placeholder-node.png";
import ttsNodeIcon from "@/public/icons/tts-node.png";
import type { ModalInput } from "./EditModal";
import type styles from "./nodes.module.scss";

interface NodeDefinition<Data extends Record<string, string | number>> {
  className: keyof typeof styles;
  defaultData: Data;
  displayName: string;
  handlers: { position: Position; type: "source" | "target" }[];
  iconSrc: string;
  modalInputs: ModalInput<Data>[];
  title: string;
}

const defineNode = <D extends Record<string, string | number>>(
  definition: NodeDefinition<D>,
) => definition;

// ─── Existing nodes ────────────────────────────────────────────────────────

const CORE_NODES = {
  compress: defineNode({
    className: "data-package",
    defaultData: {},
    displayName: "Compress",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "Compress",
  }),
  "input-node": defineNode({
    className: "source",
    defaultData: {},
    displayName: "Input",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: inputNodeIcon,
    modalInputs: [],
    title: "Input",
  }),
  "output-node": defineNode({
    className: "sink",
    defaultData: {},
    displayName: "Output",
    handlers: [{ position: Position.Left, type: "target" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "Output",
  }),
  "text-model": defineNode({
    className: "service",
    defaultData: {},
    displayName: "Text model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "Text model",
  }),
  "tti-model": defineNode({
    className: "service",
    defaultData: {},
    displayName: "TTI model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "Text to image model",
  }),
  "tts-model": defineNode({
    className: "service",
    defaultData: {},
    displayName: "TTS model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: ttsNodeIcon,
    modalInputs: [],
    title: "Text to speech model",
  }),
} as const;

// ─── SP-J Financial Contract Combinators ──────────────────────────────────
//
// Each node maps to a canvas tile. Port wiring follows the SPJ algebra:
//   - Combinators that take sub-contracts have Left (target) + Right (source)
//   - Leaf nodes (zero, one, observables) have only Right (source)
//   - The output-node / sink receives the final composed contract on the Left
//
// defaultData holds the parameters that EditModal will surface to the user.
// The actual rholang codegen lives in @f1r3fly-io/financial-combinators and
// is invoked by the graph compiler (packages/financial-combinators/src/compiler.ts),
// NOT here — this file only describes canvas appearance and connectivity.

const SPJ_NODES = {

  // ── Primitives ─────────────────────────────────────────────────────────

  "spj.zero": defineNode({
    className: "data-package",
    defaultData: {},
    displayName: "zero",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "zero — null contract",
  }),

  "spj.one": defineNode({
    className: "service",
    defaultData: { currency: "USD" },
    displayName: "one",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "currency", label: "Currency", type: "text" },
    ] as ModalInput<{ currency: string }>[],
    title: "one — pay 1 unit",
  }),

  "spj.give": defineNode({
    className: "service",
    defaultData: {},
    displayName: "give",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "give — reverse parties",
  }),

  "spj.and": defineNode({
    className: "service",
    defaultData: {},
    displayName: "and",
    handlers: [
      { position: Position.Left, type: "target" },   // contract A
      { position: Position.Top, type: "target" },    // contract B
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "and — both contracts",
  }),

  "spj.or": defineNode({
    className: "service",
    defaultData: {},
    displayName: "or",
    handlers: [
      { position: Position.Left, type: "target" },   // contract A
      { position: Position.Top, type: "target" },    // contract B
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "or — holder chooses",
  }),

  "spj.scale": defineNode({
    className: "service",
    defaultData: {},
    displayName: "scale",
    handlers: [
      { position: Position.Left, type: "target" },   // sub contract
      { position: Position.Top, type: "target" },    // observable
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "scale — multiply by observable",
  }),

  "spj.when": defineNode({
    className: "service",
    defaultData: {},
    displayName: "when",
    handlers: [
      { position: Position.Left, type: "target" },   // sub contract
      { position: Position.Top, type: "target" },    // condition observable
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "when — acquire on condition",
  }),

  "spj.anytime": defineNode({
    className: "service",
    defaultData: {},
    displayName: "anytime",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Top, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "anytime — holder exercises when ready",
  }),

  "spj.until": defineNode({
    className: "service",
    defaultData: {},
    displayName: "until",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Top, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "until — void on condition",
  }),

  "spj.get": defineNode({
    className: "service",
    defaultData: {},
    displayName: "get",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "get — acquire at horizon",
  }),

  // ── Observables ────────────────────────────────────────────────────────

  "spj.obs.const": defineNode({
    className: "source",
    defaultData: { value: 1 },
    displayName: "const",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "value", label: "Value", type: "number" },
    ] as ModalInput<{ value: number }>[],
    title: "const observable",
  }),

  "spj.obs.spot": defineNode({
    className: "source",
    defaultData: { ticker: "ETH/USD" },
    displayName: "spot price",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "ticker", label: "Ticker", type: "text" },
    ] as ModalInput<{ ticker: string }>[],
    title: "spot price observable",
  }),

  "spj.obs.date": defineNode({
    className: "source",
    defaultData: { date: "2026-12-31" },
    displayName: "date",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "date", label: "Date (ISO)", type: "text" },
    ] as ModalInput<{ date: string }>[],
    title: "date condition observable",
  }),

  "spj.obs.rate": defineNode({
    className: "source",
    defaultData: { rateName: "SOFR" },
    displayName: "rate",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "rateName", label: "Rate name", type: "text" },
    ] as ModalInput<{ rateName: string }>[],
    title: "interest rate observable",
  }),

  // ── Instrument templates ───────────────────────────────────────────────
  //
  // These are pre-composed; they have no input handles (self-contained)
  // and only a Right source handle to feed into an output-node.

  "instrument.zcb": defineNode({
    className: "data-package",
    defaultData: { notional: 1000, currency: "USD", maturity: "2026-12-31" },
    displayName: "Zero-Coupon Bond",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "notional",  label: "Notional",      type: "number" },
      { key: "currency",  label: "Currency",       type: "text"   },
      { key: "maturity",  label: "Maturity (ISO)", type: "text"   },
    ] as ModalInput<{ notional: number; currency: string; maturity: string }>[],
    title: "Zero-Coupon Bond",
  }),

  "instrument.european_call": defineNode({
    className: "data-package",
    defaultData: { underlying: "ETH/USD", strike: 2000, currency: "USD", expiry: "2026-06-30" },
    displayName: "European Call",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "underlying", label: "Underlying",   type: "text"   },
      { key: "strike",     label: "Strike",        type: "number" },
      { key: "currency",   label: "Currency",      type: "text"   },
      { key: "expiry",     label: "Expiry (ISO)",  type: "text"   },
    ] as ModalInput<{ underlying: string; strike: number; currency: string; expiry: string }>[],
    title: "European Call Option",
  }),

  "instrument.american_call": defineNode({
    className: "data-package",
    defaultData: { underlying: "ETH/USD", currency: "USD", expiry: "2026-06-30" },
    displayName: "American Call",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "underlying", label: "Underlying",  type: "text" },
      { key: "currency",   label: "Currency",    type: "text" },
      { key: "expiry",     label: "Expiry (ISO)", type: "text" },
    ] as ModalInput<{ underlying: string; currency: string; expiry: string }>[],
    title: "American Call Option",
  }),

  "instrument.irs": defineNode({
    className: "data-package",
    defaultData: { notional: 1000000, fixedRate: 0.05, floatRateName: "SOFR", currency: "USD", settlement: "2026-12-31" },
    displayName: "Interest Rate Swap",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "notional",      label: "Notional",          type: "number" },
      { key: "fixedRate",     label: "Fixed rate",        type: "number" },
      { key: "floatRateName", label: "Float rate name",   type: "text"   },
      { key: "currency",      label: "Currency",          type: "text"   },
      { key: "settlement",    label: "Settlement (ISO)",  type: "text"   },
    ] as ModalInput<{ notional: number; fixedRate: number; floatRateName: string; currency: string; settlement: string }>[],
    title: "Interest Rate Swap",
  }),

  "instrument.fx_forward": defineNode({
    className: "data-package",
    defaultData: { baseCurrency: "ETH", termCurrency: "USD", forwardRate: 2500, delivery: "2026-03-31" },
    displayName: "FX Forward",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "baseCurrency", label: "Base currency",   type: "text"   },
      { key: "termCurrency", label: "Term currency",   type: "text"   },
      { key: "forwardRate",  label: "Forward rate",    type: "number" },
      { key: "delivery",     label: "Delivery (ISO)",  type: "text"   },
    ] as ModalInput<{ baseCurrency: string; termCurrency: string; forwardRate: number; delivery: string }>[],
    title: "FX Forward",
  }),

  "instrument.perpetual_bond": defineNode({
    className: "data-package",
    defaultData: { coupon: 50, currency: "USD" },
    displayName: "Perpetual Bond",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { key: "coupon",   label: "Coupon",   type: "number" },
      { key: "currency", label: "Currency", type: "text"   },
    ] as ModalInput<{ coupon: number; currency: string }>[],
    title: "Perpetual / Callable Bond",
  }),

} as const;

// ─── Combined registry ─────────────────────────────────────────────────────

export const NODE_REGISTRY = {
  ...CORE_NODES,
  ...SPJ_NODES,
} as const;

export type NodeRegistry = typeof NODE_REGISTRY;
export type NodeKind = keyof NodeRegistry;