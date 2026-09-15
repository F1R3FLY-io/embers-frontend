import * as Blockly from "blockly";

import { oslfBlocks } from "@/core/blocks";
import { registerOslfBlocks } from "@/core/register";

/**
 * A Blockly workspace with no rendering.
 *
 * `Blockly.inject` builds an SVG surface and measures it, which jsdom cannot do
 * -- it implements no layout, and Blockly's renderer reaches for
 * `getScreenCTM` and text metrics that simply are not there. A headless
 * `Blockly.Workspace` skips all of that while keeping the parts worth testing:
 * block definitions, the serializer, and code generation.
 *
 * So the boundary this draws is deliberate. Everything expressible as "given
 * these blocks, what does the workspace hold and what code does it generate"
 * belongs here. Everything about the rendered editor -- dragging from the
 * flyout, the toolbox chrome, the search field -- is a browser question and is
 * covered by the end-to-end suites instead. Approximating those in jsdom would
 * assert against a fiction.
 */
export function makeWorkspace(): Blockly.Workspace {
  registerOslfBlocks(oslfBlocks);
  return new Blockly.Workspace();
}

/** Loads serialized workspace state, the shape the app persists and reloads. */
export function loadState(
  workspace: Blockly.Workspace,
  state: Record<string, unknown>,
): void {
  Blockly.serialization.workspaces.load(state, workspace);
}

/** Serializes a workspace, the shape the app saves. */
export function saveState(
  workspace: Blockly.Workspace,
): Record<string, unknown> {
  return Blockly.serialization.workspaces.save(workspace);
}
