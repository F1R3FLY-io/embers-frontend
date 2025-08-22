import { Position } from "@xyflow/react";

import { Text } from "@/lib/components/Text";

import styles from "./nodes.module.scss";
import { NodeTemplate } from "./NodeTemplate";

export const nodeTypes = {
  compress: NodeTemplate({
    children: <Text color="primary">Compress</Text>,
    className: styles["data-package"],
    displayName: "Compress",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
  }),
  "manual-input": NodeTemplate({
    children: <Text color="primary">Manual Input</Text>,
    className: styles.source,
    displayName: "Manual input",
    handlers: [{ position: Position.Right, type: "source" }],
  }),
  "send-to-channel": NodeTemplate({
    children: <Text color="primary">Send to channel</Text>,
    className: styles.sink,
    displayName: "Send to channel",
    handlers: [{ position: Position.Left, type: "target" }],
  }),
  "text-model": NodeTemplate({
    children: <Text color="primary">Text model</Text>,
    className: styles.service,
    displayName: "Text model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
  }),
  "tti-model": NodeTemplate({
    children: <Text color="primary">Text to image model</Text>,
    className: styles.service,
    displayName: "TTI model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
  }),
  "tts-model": NodeTemplate({
    children: <Text color="primary">Text to speech model</Text>,
    className: styles.service,
    displayName: "TTS model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
  }),
};
export type NodeTypes = typeof nodeTypes;
