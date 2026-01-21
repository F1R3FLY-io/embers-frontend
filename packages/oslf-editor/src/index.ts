import type { BlockDefinition } from "blockly/core/blocks";

import * as Blockly from "blockly/core";

import "./components/input-search";
import {
  generateCode,
  Order,
  registerBlocks,
  rhoLangGenerator,
  RhoLangGenerator,
} from "./generator";
import { initEditor } from "./initEditor";

export enum Events {
  INIT = "blockly:init",
  ON_CHANGE = "blockly:on_change",
}

// Module-level state for block filtering
let originalBlocks: BlockDefinition[] = [];
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_TOOLBOX = {
  contents: [
    {
      contents: [],
      kind: "category",
      name: "Controls",
    },
    {
      contents: [],
      kind: "category",
      name: "Empty",
    },
  ],
  kind: "categoryToolbox",
};

export type OSLFInstance = {
  workspace: Blockly.Workspace;
};

function dispatchChanges(workspace: Blockly.Workspace) {
  const state = Blockly.serialization.workspaces.save(
    workspace as Blockly.WorkspaceSvg,
  );

  // Generate code from workspace using message0 templates
  const code = generateCode(workspace);

  window.dispatchEvent(
    new CustomEvent(Events.ON_CHANGE, {
      bubbles: true,
      composed: true,
      detail: { code, state },
    }),
  );
}

function setupWorkspaceChangeListener(workspace: Blockly.Workspace) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    // Ignore UI events, only save on actual workspace changes
    if (event.isUiEvent) {
      return;
    }

    // Debounce to avoid excessive saves
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      dispatchChanges(workspace);
    }, 1000); // Save 1 second after last change
  });
}

function filterBlocksByTooltip(
  blocks: BlockDefinition[],
  searchTerm: string,
): BlockDefinition[] {
  if (!searchTerm || searchTerm.trim() === "") {
    return blocks;
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();

  return blocks.filter((block) => {
    return block.tooltip
      ? block.tooltip.toLowerCase().includes(normalizedSearch)
      : false;
  });
}

// Category mapping based on block style to display name
const CATEGORY_MAP: Record<string, string> = {
  arithmetic_blocks: "Arithmetic",
  collection_blocks: "Collections",
  comparison_blocks: "Comparison",
  composition_blocks: "Composition",
  control_blocks: "Control Flow",
  declaration_blocks: "Declarations",
  ground_blocks: "Ground types",
  logical_blocks: "Logical Operations",
  method_blocks: "Methods & Paths",
  name_blocks: "Names",
  process_blocks: "Basic processes",
  receipt_blocks: "Receipts & Binds",
  send_receive_blocks: "Send & Receive",
};

// Order of categories in the toolbox
const CATEGORY_ORDER = [
  "ground_blocks",
  "name_blocks",
  "collection_blocks",
  "receipt_blocks",
  "control_blocks",
  "declaration_blocks",
  "process_blocks",
  "logical_blocks",
  "arithmetic_blocks",
  "comparison_blocks",
  "method_blocks",
  "send_receive_blocks",
  "composition_blocks",
];

function generateToolboxFromBlocks(
  blocks: BlockDefinition[],
  isSearchActive = false,
) {
  if (isSearchActive) {
    // When searching, show all results in a single expanded category
    const customBlocksToolbox = blocks.map((block) => ({
      kind: "block",
      type: block.type,
    }));
    return {
      contents: [
        {
          colour: "#5C81A6",
          contents: customBlocksToolbox,
          expanded: "true",
          kind: "category",
          name: `Search Results (${blocks.length})`,
        },
      ],
      kind: "categoryToolbox",
    };
  }

  // Group blocks by their style (category)
  const blocksByCategory: Record<string, BlockDefinition[]> = {};

  for (const block of blocks) {
    const style = block.style || "process_blocks";
    if (!blocksByCategory[style]) {
      blocksByCategory[style] = [];
    }
    blocksByCategory[style].push(block);
  }

  // Build category contents in specified order
  const contents: Array<{
    contents: Array<{ kind: string; type: string }>;
    kind: string;
    name: string;
  }> = [];

  for (const categoryStyle of CATEGORY_ORDER) {
    const categoryBlocks = blocksByCategory[categoryStyle];
    if (categoryBlocks && categoryBlocks.length > 0) {
      contents.push({
        contents: categoryBlocks.map((block) => ({
          kind: "block",
          type: block.type,
        })),
        kind: "category",
        name: CATEGORY_MAP[categoryStyle] || categoryStyle,
      });
    }
  }

  // Add any remaining blocks that don't match known categories
  const knownStyles = new Set(CATEGORY_ORDER);
  for (const [style, categoryBlocks] of Object.entries(blocksByCategory)) {
    if (!knownStyles.has(style) && categoryBlocks.length > 0) {
      contents.push({
        contents: categoryBlocks.map((block) => ({
          kind: "block",
          type: block.type,
        })),
        kind: "category",
        name: CATEGORY_MAP[style] || style,
      });
    }
  }

  // If no categories were created, show a default
  if (contents.length === 0) {
    return {
      contents: [
        {
          contents: blocks.map((block) => ({
            kind: "block",
            type: block.type,
          })),
          kind: "category",
          name: "Blocks",
        },
      ],
      kind: "categoryToolbox",
    };
  }

  return {
    contents,
    kind: "categoryToolbox",
  };
}

function updateToolboxWithFilter(
  workspace: Blockly.Workspace,
  searchTerm: string,
) {
  // Guard: blocks not yet loaded
  if (originalBlocks.length === 0) {
    return;
  }

  const filteredBlocks = filterBlocksByTooltip(originalBlocks, searchTerm);
  // Show search results in expanded category when searching
  const isSearchActive = searchTerm.trim() !== "";
  const updatedToolbox = generateToolboxFromBlocks(
    filteredBlocks,
    isSearchActive,
  );

  const workspaceSvg = workspace as Blockly.WorkspaceSvg;
  workspaceSvg.updateToolbox(updatedToolbox);

  // Auto-select first category to show blocks in flyout when searching
  if (isSearchActive) {
    const toolbox = workspaceSvg.getToolbox();
    if (toolbox) {
      // Select the first category (position 0) to open the flyout
      toolbox.selectItemByPosition(0);
    }
  }
}

function loadBlocks(
  workspace: Blockly.Workspace,
  event: CustomEvent<BlockDefinition[]>,
) {
  const blocks = event.detail;
  if (blocks) {
    // Store original blocks for filtering
    originalBlocks = blocks;

    Blockly.defineBlocksWithJsonArray(blocks);

    // Register blocks with the code generator
    registerBlocks(blocks);

    // Use shared toolbox generation function
    const updatedToolbox = generateToolboxFromBlocks(blocks);

    // Update the workspace toolbox
    const workspaceSvg = workspace as Blockly.WorkspaceSvg;
    workspaceSvg.updateToolbox(updatedToolbox);
  }
}

export function init(container: Element): OSLFInstance {
  // Inject fonts (style @import)
  const style = document.createElement("style");
  style.innerText =
    "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');";
  style.innerText += `
	  .blocklyToolbox,
	  svg.blocklySvg {
			height: 100% !important;
		}
	  .blocklyToolbox{
			padding-top: 0;
			min-width: 180px;
			overflow-y: hidden;
		}
		.blocklyToolboxCategory{
			padding: 0;
			margin-bottom: 0;
			height: 45px
		}
	  .blocklyToolboxCategory.blocklyToolboxSelected{
			background-color: transparent !important;
			border-left: #9A52FF 2px solid;
		}
	  .blocklyToolboxCategory.blocklyToolboxSelected .blocklyToolboxCategoryLabel{
			color: #ffffff !important;
		}
		.blocklyToolbox, .blocklyFlyout{
			border-right: #2E3F52 2px solid;
		}
		.blocklyTreeRowContentContainer::before{
			display: none;
		}
		.blocklyToolboxCategoryGroup {
			overflow-y: auto;
			height: 100%;
			flex-wrap: nowrap !important;
		}
		.blocklyToolboxCategoryIcon{
			display: none !important;
		}
		.blocklyToolboxCategoryContainer{
			padding: 0 !important;
			margin: 0 !important;
		}
		.blocklyToolboxCategoryContainer:after{
			display: none;
		}
		.blocklyToolboxCategoryContainer:hover .blocklyToolboxCategoryLabel{
			color: #ffffff !important;
		}
		.blocklyToolboxCategoryLabel {
		  display: block;
			font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			font-size: 14px;
			font-weight: 400;
			line-height: 150%;
			letter-spacing: 0px;
			outline: none;
			box-sizing: border-box;
			color: #9CA3AF !important;
			padding: 12px 16px 12px 24px !important;
			cursor: pointer;
			transition: color 0.15s ease;
		}
		.blocklyTreeRow{
			padding: 0 !important;
			margin: 0 !important;
			height: auto !important;
			line-height: normal !important;
		}
		.blocklyTreeRowContentContainer{
			padding: 0 !important;
			position: relative;
		}
		.blocklyTreeRowContentContainer::before{
			content: "";
			position: absolute;
			left: 8px;
			top: 50%;
			transform: translateY(-50%);
			width: 2px;
			height: 20px;
			background-color: transparent;
			border-radius: 1px;
			transition: background-color 0.15s ease;
		}
		.blocklyToolboxCategory.blocklyToolboxSelected .blocklyTreeRowContentContainer::before{
			background-color: #8B5CF6;
		}
  `;
  document.head.appendChild(style);

  // inject search input
  const searchInput = document.createElement("input-search");
  searchInput.setAttribute("placeholder", "Search blocks...");

  const workspace = initEditor(container, DEFAULT_TOOLBOX);

  container.addEventListener(Events.INIT, (event) => {
    loadBlocks(workspace, event as any);
  });

  setupWorkspaceChangeListener(workspace);

  const toolbox = document.getElementsByClassName("blocklyToolbox")[0];
  if (toolbox) {
    toolbox.prepend(searchInput);
  }

  // Setup search input event listeners
  searchInput.addEventListener("search", (event: Event) => {
    const customEvent = event as CustomEvent<{ value: string }>;
    const searchTerm = customEvent.detail.value;

    // Debounce to avoid excessive updates
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(() => {
      updateToolboxWithFilter(workspace, searchTerm);
    }, 300);
  });

  searchInput.addEventListener("clear", () => {
    // Clear debounce timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    // Immediately restore all blocks
    updateToolboxWithFilter(workspace, "");
  });

  return {
    workspace,
  };
}

// Re-export generator utilities
export {
  generateCode,
  Order,
  registerBlocks,
  rhoLangGenerator,
  RhoLangGenerator,
};

export { oslfBlocks, oslfCategories } from "./core/blocks";

// Re-export Blockly serialization utilities for workspace state management
export const workspaceSerialization = {
  load: Blockly.serialization.workspaces.load,
  save: Blockly.serialization.workspaces.save,
};

export type { OSLFBlockCategory } from "./core/blocks";
export { createBlockAtClientPoint } from "./core/createBlockAtClientPoint";
export { registerOslfBlocks } from "./core/register";
// Re-export gradient utilities
export { applyBlockGradients, removeBlockGradients } from "./gradients";
