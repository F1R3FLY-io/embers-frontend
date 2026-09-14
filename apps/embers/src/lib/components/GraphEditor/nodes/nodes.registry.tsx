import { Position } from "@xyflow/react";

import inputNodeIcon from "@/public/icons/input-node.png";
import defaultNodeIcon from "@/public/icons/placeholder-node.png";
import ttsNodeIcon from "@/public/icons/tts-node.png";

import type { ModalInput } from "./EditModal";
import type styles from "./nodes.module.scss";

interface NodeDefinition {
  className: keyof typeof styles;
  defaultData: Record<string, string | number>;
  displayName: string;
  handlers: { position: Position; type: "source" | "target" }[];
  iconSrc: string;
  /**
   * Key in a node's own `data` holding a per-instance label. When present and a
   * non-empty string it replaces `title` on the canvas. Built-in kinds omit it
   * and so render exactly as before.
   */
  labelKey?: string;
  modalInputs: ModalInput<Record<string, string | number>>[];
  /**
   * When true, the kind is not offered on any creation surface (the sidebar
   * palette and the add-node context menu). It stays in the registry so
   * existing nodes of this kind still render and round-trip -- this hides a
   * kind from authoring without removing it from the schema.
   */
  paletteHidden?: boolean;
  title: string;
}

const defineNode = (definition: NodeDefinition) => definition;

const protocolInput: ModalInput<Record<string, string | number>> = {
  name: "protocol",
  type: "string",
  options: [
    { label: "Direct input and result (simple-v1)", value: "simple-v1" },
    {
      label: "Workflow invocation and result (structured-v1)",
      value: "structured-v1",
    },
  ],
  helperText:
    "Match the agent's code. Direct agents return their result. Workflow agents read invocation.input and return {output, disposition}.",
};

export const NODE_REGISTRY = {
  /**
   * A user-defined agent. One generic kind covers every agent the user writes:
   * the specific agent is carried in the node's own data, which the sidebar
   * supplies from the drag payload.
   */
  agent: defineNode({
    className: "service",
    defaultData: { protocol: "simple-v1" },
    displayName: "Agent",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    labelKey: "agentName",
    modalInputs: [protocolInput],
    title: "Agent",
  }),
  approval: defineNode({
    className: "service",
    defaultData: { approvers: "", policyId: "owner", quorum: 1 },
    displayName: "Approval",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { name: "policyId", type: "string" },
      { name: "quorum", type: "number" },
      { name: "approvers", type: "string" },
    ],
    title: "Approval",
  }),
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
  "fan-in-map": defineNode({
    className: "data-package",
    defaultData: {},
    displayName: "Fan-in map",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "Fan-in map",
  }),
  "final-node": defineNode({
    className: "sink",
    defaultData: {},
    displayName: "Final",
    handlers: [{ position: Position.Left, type: "target" }],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "Final",
  }),
  "foreign-term": defineNode({
    className: "service",
    defaultData: {
      activityAuthorities: "",
      artifactHash: "",
      entrypoint: "main",
      fuel: 10000,
      inputBinding: "input",
      languageSpecificationHash: "",
      languageTag: "lambda",
      maxOutputBytes: 65536,
      maxPhlo: 5000000,
      outputBinding: "output",
      source: "",
    },
    displayName: "Foreign-language term",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { name: "languageTag", type: "string" },
      { name: "languageSpecificationHash", type: "string" },
      { name: "source", type: "string" },
      { name: "artifactHash", type: "string" },
      { name: "entrypoint", type: "string" },
      { name: "inputBinding", type: "string" },
      { name: "outputBinding", type: "string" },
      { name: "fuel", type: "number" },
      { name: "maxOutputBytes", type: "number" },
      { name: "maxPhlo", type: "number" },
      { name: "activityAuthorities", type: "string" },
    ],
    // Hidden from authoring until the governing FIPS is accepted: an FLT
    // activity compiles to a deterministic "unavailable" failure today
    // (workflow_rendering.rs), so offering it as a usable node would present
    // a control that cannot work. The registry entry stays so any existing
    // definition containing an FLT node still renders and round-trips.
    paletteHidden: true,
    title: "Foreign-language term",
  }),
  gateway: defineNode({
    className: "data-package",
    defaultData: {},
    displayName: "Gateway",
    labelKey: "label",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [],
    title: "Gateway",
  }),
  history: defineNode({
    className: "data-package",
    defaultData: { history: "shallow" },
    displayName: "History",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [{ name: "history", type: "string" }],
    title: "History",
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
  "rholang-activity": defineNode({
    className: "service",
    defaultData: { protocol: "structured-v1", uri: "" },
    displayName: "Rholang activity",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [{ name: "uri", type: "string" }, protocolInput],
    title: "Rholang activity",
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
  wait: defineNode({
    className: "service",
    defaultData: { delayMillis: 60000, signal: "resume", waitFor: "signal" },
    displayName: "Wait",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { name: "waitFor", type: "string" },
      { name: "signal", type: "string" },
      { name: "delayMillis", type: "number" },
    ],
    title: "Wait",
  }),
  "workflow-activity": defineNode({
    className: "service",
    defaultData: { teamId: "", version: "" },
    displayName: "Nested workflow",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modalInputs: [
      { name: "teamId", type: "string" },
      { name: "version", type: "string" },
    ],
    title: "Nested workflow",
  }),
} as const;

export type NodeRegistry = typeof NODE_REGISTRY;
export type NodeKind = keyof NodeRegistry;
