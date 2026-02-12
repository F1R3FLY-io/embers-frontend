import { defineBlocksWithJsonArray } from "blockly/core";

import { registerBlocks as registerGeneratorBlocks } from "../generator";

export function registerOslfBlocks(blocks: any[]) {
  defineBlocksWithJsonArray(blocks);
  registerGeneratorBlocks(blocks);
}
