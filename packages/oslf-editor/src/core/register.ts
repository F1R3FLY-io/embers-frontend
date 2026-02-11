import type { BlockDefinition } from "blockly/core/blocks";

import * as Blockly from "blockly/core";

import { registerBlocks as registerGeneratorBlocks } from "../generator";

export function registerOslfBlocks(blocks: BlockDefinition[]) {
  Blockly.defineBlocksWithJsonArray(blocks);
  registerGeneratorBlocks(blocks);
}
