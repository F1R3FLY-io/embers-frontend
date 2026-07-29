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
  /**
   * Key in a node's own `data` holding a per-instance label. When present and a
   * non-empty string it replaces `title` on the canvas. Built-in kinds omit it
   * and so render exactly as before.
   */
  labelKey?: string;
  modalInputs: ModalInput<Data>[];
  title: string;
}

const defineNode = <D extends Record<string, string | number>>(
  definition: NodeDefinition<D>,
) => definition;

export const NODE_REGISTRY = {
  /**
   * A user-defined agent. One generic kind covers every agent the user writes:
   * the specific agent is carried in the node's own data, which the sidebar
   * supplies from the drag payload.
   */
  agent: defineNode({
    className: "service",
    defaultData: {},
    displayName: "Agent",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    labelKey: "agentName",
    modalInputs: [],
    title: "Agent",
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

export type NodeRegistry = typeof NODE_REGISTRY;
export type NodeKind = keyof NodeRegistry;
