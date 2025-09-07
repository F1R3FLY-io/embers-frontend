import { Position } from "@xyflow/react";

import inputNodeIcon from "@/public/icons/input-node.png";
import defaultNodeIcon from "@/public/icons/placeholder-node.png";
import ttsNodeIcon from "@/public/icons/tts-node.png";

export interface NodeDefinition<Data extends Record<string, unknown> = Record<string, unknown>> {
  className: string;
  defaultData: Data;
  displayName: string;
  handlers?: Array<{ position: Position; type: "source" | "target" }>;
  hideInMenu?: boolean;
  iconSrc?: string; // ← string path, not JSX
  menuLabel?: string;
  title: string;
}

export const NODE_REGISTRY = {
  compress: {
    className: "data-package",
    defaultData: {},
    displayName: "Compress",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    title: "Compress",
  },
  "manual-input": {
    className: "source",
    defaultData: {},
    displayName: "Manual Input",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: inputNodeIcon,
    title: "Manual Input",
  },
  "send-to-channel": {
    className: "sink",
    defaultData: {},
    displayName: "Send to channel",
    handlers: [{ position: Position.Left, type: "target" }],
    iconSrc: defaultNodeIcon,
    menuLabel: "Add sink",
    title: "Send to channel",
  },
  "text-model": {
    className: "service",
    defaultData: {},
    displayName: "Text model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    title: "Text model",
  },
  "tti-model": {
    className: "service",
    defaultData: {},
    displayName: "TTI model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    menuLabel: "Add text to image model",
    title: "Text to image model",
  },
  "tts-model": {
    className: "service",
    defaultData: {},
    displayName: "TTS model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: ttsNodeIcon,
    menuLabel: "Add text to speech model",
    title: "Text to speech model",
  },
} as const satisfies Record<string, NodeDefinition>;

export type NodeRegistry = typeof NODE_REGISTRY;
export type NodeKind = keyof NodeRegistry;
export type NodeDataOf<K extends NodeKind> = NodeRegistry[K]["defaultData"];
