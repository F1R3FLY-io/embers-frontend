/**
 * @module @f1r3fly-io/financial-combinators
 *
 * Simon Peyton-Jones combinator algebra for financial contracts,
 * typed for use as Embers dataflow building blocks.
 *
 * Reference: "Composing contracts: an adventure in financial engineering"
 *            Jones, Eber, Seward – ICFP 2000
 *
 * Each combinator maps to:
 *   1. A TypeScript type in this file
 *   2. A rholang code-gen function in codegen.ts
 *   3. An Embers NodeDefinition in registry.ts
 */

// ─────────────────────────────────────────────
// Primitive value types flowing through the graph
// ─────────────────────────────────────────────

/** ISO-8601 date string: "2025-12-31" */
export type DateLiteral = string;

/** Observable: a time-varying real-valued quantity */
export interface Observable {
  kind: "const" | "spot" | "rate" | "index";
  label: string;           // human-readable ticker / description
  rhoName: string;         // rholang channel name for this observable
}

/** Currency / asset denomination */
export type Currency = string; // e.g. "USD", "ETH", "REV"

// ─────────────────────────────────────────────
// Contract AST nodes
// ─────────────────────────────────────────────

export type Contract =
  | ZeroContract
  | OneContract
  | GiveContract
  | AndContract
  | OrContract
  | ScaleContract
  | WhenContract
  | AnytimeContract
  | UntilContract
  | GetContract
  | AndbindContract;

export interface ZeroContract   { tag: "Zero" }
export interface OneContract    { tag: "One";      currency: Currency }
export interface GiveContract   { tag: "Give";     sub: Contract }
export interface AndContract    { tag: "And";      left: Contract; right: Contract }
export interface OrContract     { tag: "Or";       left: Contract; right: Contract }
export interface ScaleContract  { tag: "Scale";    obs: Observable; sub: Contract }
export interface WhenContract   { tag: "When";     cond: Observable; sub: Contract }
export interface AnytimeContract{ tag: "Anytime";  cond: Observable; sub: Contract }
export interface UntilContract  { tag: "Until";    cond: Observable; sub: Contract }
export interface GetContract    { tag: "Get";      sub: Contract }
export interface AndbindContract{
  tag: "Andbind";
  obs: Observable;
  binder: (obs: Observable) => Contract;
}

// ─────────────────────────────────────────────
// Embers node port descriptors
// ─────────────────────────────────────────────

export type PortKind = "contract" | "observable" | "currency" | "date";

export interface PortSpec {
  id: string;
  label: string;
  kind: PortKind;
  optional?: boolean;
}

// ─────────────────────────────────────────────
// Embers NodeDefinition shape
// (mirrors the shape expected by the embers-frontend node registry)
// ─────────────────────────────────────────────

export interface NodeDefinition {
  /** Unique stable ID used in serialised graphs */
  id: string;
  /** Display name in palette */
  label: string;
  /** Palette category */
  category: "SPJ Combinators" | "Financial Instruments" | "Observables";
  /** Short tooltip */
  description: string;
  /** SVG icon path data */
  icon: string;
  /** Input ports */
  inputs: PortSpec[];
  /** Output ports – always a single "contract" port for combinators */
  outputs: PortSpec[];
  /** Default parameter values stored on the node */
  defaultParams: Record<string, unknown>;
  /**
   * Generates rholang source for this node given resolved child code.
   * `params` are the node's own parameter values.
   * `inputCode` maps input port id → rholang expression string.
   */
  toRholang: (params: Record<string, unknown>, inputCode: Record<string, string>) => string;
}
