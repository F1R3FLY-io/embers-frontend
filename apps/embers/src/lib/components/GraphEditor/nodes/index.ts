import { ManualInput } from "./ManualInput";
import { SendToChannel } from "./SendToChannel";

export const nodeTypes = {
  "manual-input": ManualInput,
  "send-to-channel": SendToChannel,
};
export type NodeTypes = typeof nodeTypes;
