import { CrossTabCopyPaste } from "@blockly/plugin-cross-tab-copy-paste";
import * as Blockly from "blockly/core";
import En from "blockly/msg/en";

import { RENDERER_NAME } from "../CustomRenderer";
import { applyBlockGradients } from "../gradients";
import OslfTheme from "../theme";

export function initEditor(
	container: string | Element,
	initToolbox: Blockly.utils.toolbox.ToolboxDefinition,
): Blockly.WorkspaceSvg {
	Blockly.setLocale(En);

	const toolbox = initToolbox;

	const workspace = Blockly.inject(container, {
		disable: false,
		grid: { colour: "#3e4042", length: 1, snap: true, spacing: 7 },
		renderer: RENDERER_NAME,
		scrollbars: false,
		sounds: false,
		theme: OslfTheme,
		toolbox,
		trashcan: false,
	});

	const plugin = new CrossTabCopyPaste();
	plugin.init({ contextMenu: true, shortcut: true }, () => {
		console.error("Some error occurred while copying or pasting");
	});
	Blockly.ContextMenuRegistry.registry.unregister("blockDuplicate");

	applyBlockGradients(workspace);

	return workspace;
}
