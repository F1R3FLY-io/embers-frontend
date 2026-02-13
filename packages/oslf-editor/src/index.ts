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
let originalBlocks: any[] = [];
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

function filterBlocksByTooltip(blocks: any[], searchTerm: string): any[] {
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

function generateToolboxFromBlocks(blocks: any[], isSearchActive = false) {
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
  const blocksByCategory: Record<string, any[]> = {};

  for (const block of blocks) {
    const style = block.style || "process_blocks";
    if (!(style in blocksByCategory)) {
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

function loadBlocks(workspace: Blockly.Workspace, event: CustomEvent<any[]>) {
  const blocks = event.detail;
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

const OSLF_STYLE_ID = "oslf-editor-styles";

function ensureOslfStyles() {
  if (document.getElementById(OSLF_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = OSLF_STYLE_ID;

  style.innerText = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');

.blocklyToolbox {
  display: flex;
  flex-direction: column;
  height: 100% !important;
  background: var(--background-color);
  padding-top: 0;
  min-width: 180px;
  width: 280px;
  overflow: hidden;
  border-right: 1px solid var(--background-neutral-surface-secondary, #444);
}

.blocklyToolboxCategoryGroup {
  flex: 1;
  padding: 8px 8px 12px;
  overflow: auto;
  overflow-x: hidden;
  height: auto;
  flex-wrap: nowrap !important;
}

.blocklyToolbox > input-search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 15px 24px;
  background: var(--background-color);
  border-bottom: 1px solid var(--background-neutral-surface-secondary, #444);
  box-sizing: border-box;
}

.blocklyToolbox > input-search input {
  width: 100%;
}

.blocklyToolboxCategory {
  padding: 0;
  margin: 0;
  height: 45px;
}

.blocklyToolboxCategoryIcon {
  display: none !important;
}

.blocklyToolboxCategoryContainer {
  padding: 0 !important;
  margin: 0 !important;
}

.blocklyToolboxCategoryContainer:after {
  display: none;
}

.blocklyToolboxCategoryLabel {
  display: block;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 150%;
  outline: none;
  box-sizing: border-box;
  color: #9CA3AF !important;
  padding: 12px 16px 12px 24px !important;
  cursor: pointer;
  transition: color 0.15s ease;
}

.blocklyToolboxCategoryContainer:hover .blocklyToolboxCategoryLabel {
  color: #ffffff !important;
}

.blocklyToolboxCategory.blocklyToolboxSelected {
  background-color: transparent !important;
  border-left: #9A52FF 2px solid;
}

.blocklyToolboxCategory.blocklyToolboxSelected .blocklyToolboxCategoryLabel {
  color: #ffffff !important;
}


.blocklyFlyout {
  border-right: none !important;
}

svg.blocklySvg {
  height: 100% !important;
}
`;

  document.head.appendChild(style);
}

const INIT_MARK = "__oslf_inited__";

export function init(container: Element): OSLFInstance {
  const el = container as any;

  if (el[INIT_MARK]?.workspace) {
    return el[INIT_MARK];
  }
  container.innerHTML = "";
  ensureOslfStyles();

  // inject search input
  const searchInput = document.createElement("input-search");
  searchInput.setAttribute("placeholder", "Search blocks...");

  const workspace = initEditor(container, DEFAULT_TOOLBOX);

  container.addEventListener(Events.INIT, (event) => {
    loadBlocks(workspace, event as any);
  });

  setupWorkspaceChangeListener(workspace);

  const toolbox = document.getElementsByClassName("blocklyToolbox").item(0);
  toolbox?.prepend(searchInput);

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

  const instance = { workspace };
  el[INIT_MARK] = instance;
  return instance;
}

// Re-export generator utilities
export {
  generateCode,
  Order,
  registerBlocks,
  rhoLangGenerator,
  RhoLangGenerator,
};

export { oslfBlocks } from "./core/blocks";

// Re-export Blockly serialization utilities for workspace state management
export const workspaceSerialization = {
  load: Blockly.serialization.workspaces.load,
  save: Blockly.serialization.workspaces.save,
};

export { createBlockAtClientPoint } from "./core/createBlockAtClientPoint";
export { registerOslfBlocks } from "./core/register";
// Re-export gradient utilities
export { applyBlockGradients, removeBlockGradients } from "./gradients";
