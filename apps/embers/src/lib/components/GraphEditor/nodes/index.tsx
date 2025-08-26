import { Position } from "@xyflow/react";

import inputNodeIcon from "@/public/icons/input-node.png";
import defaultNodeIcon from "@/public/icons/placeholder-node.png";
import ttsNodeIcon from "@/public/icons/tts-node.png";

import { DeployContainerNode } from "./DeployContainer";
import styles from "./nodes.module.scss";
import { NodeTemplate } from "./NodeTemplate";

export const nodeTypes = {
  compress: NodeTemplate({
    className: styles["data-package"],
    displayName: "Compress",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    icon: <img src={defaultNodeIcon} />,
    title: "Compress",
  }),
  "deploy-container": DeployContainerNode,
  "manual-input": NodeTemplate({
    className: styles.source,
    displayName: "Manual Input",
    handlers: [{ position: Position.Right, type: "source" }],
    icon: <img src={inputNodeIcon} />,
    title: "Manual Input",
  }),
  "send-to-channel": NodeTemplate({
    className: styles.sink,
    displayName: "Send to channel",
    handlers: [{ position: Position.Left, type: "target" }],
    icon: <img src={defaultNodeIcon} />,
    title: "Send to channel",
  }),
  "text-model": NodeTemplate({
    className: styles.service,
    displayName: "Text model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    icon: <img src={defaultNodeIcon} />,
    title: "Text model",
  }),
  "tti-model": NodeTemplate({
    className: styles.service,
    displayName: "TTI model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    icon: <img src={defaultNodeIcon} />,
    title: "Text to image model",
  }),
  "tts-model": NodeTemplate({
    className: styles.service,
    displayName: "TTS model",
    handlers: [
      { position: Position.Left, type: "target" },
      { position: Position.Right, type: "source" },
    ],
    icon: <img src={ttsNodeIcon} />,
    title: "Text to speech model",
  }),
};
export type NodeTypes = typeof nodeTypes;
