import type React from "react";

import { Position } from "@xyflow/react";

import { ManualInputModal } from "@/lib/components/GraphEditor/nodes/EditModals";
import inputNodeIcon from "@/public/icons/input-node.png";
import defaultNodeIcon from "@/public/icons/placeholder-node.png";
import ttsNodeIcon from "@/public/icons/tts-node.png";

export interface NodeDefinition<
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  className: string;
  defaultData: Data;
  displayName: string;
  handlers?: Array<{ position: Position; type: "source" | "target" }>;
  iconSrc?: string;
  modal?: React.ComponentType<{
    initial: Data;
    onCancel?: (() => void) | undefined;
    onSave: (data: Data) => void;
  }>;
  title: string;
}

export const NODE_REGISTRY = {
  compress: {
    className: "data-package",
    defaultData: {} as Record<string, unknown>,
    displayName: "Compress",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modal: ManualInputModal,
    title: "Compress",
  },
  "manual-input": {
    className: "source",
    defaultData: {} as Record<string, unknown>,
    displayName: "Manual Input",
    handlers: [{ position: Position.Right, type: "source" }],
    iconSrc: inputNodeIcon,
    modal: ManualInputModal,
    title: "Manual Input",
  },
  "send-to-channel": {
    className: "sink",
    defaultData: {} as Record<string, unknown>,
    displayName: "Send to channel",
    handlers: [{ position: Position.Left, type: "target" }],
    iconSrc: defaultNodeIcon,
    modal: ManualInputModal,
    title: "Send to channel",
  },
  "text-model": {
    className: "service",
    defaultData: {} as Record<string, unknown>,
    displayName: "Text model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modal: ManualInputModal,
    title: "Text model",
  },
  "tti-model": {
    className: "service",
    defaultData: {} as Record<string, unknown>,
    displayName: "TTI model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: defaultNodeIcon,
    modal: ManualInputModal,
    title: "Text to image model",
  },
  "tts-model": {
    className: "service",
    defaultData: {} as Record<string, unknown>,
    displayName: "TTS model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    iconSrc: ttsNodeIcon,
    modal: ManualInputModal,
    title: "Text to speech model",
  },
} as const satisfies Record<string, NodeDefinition>;

export type NodeRegistry = typeof NODE_REGISTRY;
export type NodeKind = keyof NodeRegistry;
export type NodeDataOf<K extends NodeKind> = NodeRegistry[K]["defaultData"];
