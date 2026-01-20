import type { BlockDefinition } from "blockly/core/blocks";

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

/**
 * Filters blocks by their tooltip text based on a search term.
 *
 * @param blocks - Array of block definitions to filter
 * @param searchTerm - Search term to match against block tooltips
 * @returns Filtered array of blocks whose tooltips contain the search term
 */
export function filterBlocksByTooltip(
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

/**
 * Generates a Blockly toolbox configuration from an array of block definitions.
 *
 * @param blocks - Array of block definitions
 * @param isSearchActive - Whether search is active (affects category display)
 * @returns Blockly toolbox definition object
 */
export function generateToolboxFromBlocks(
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

/**
 * Export category mapping and order for external use
 */
export { CATEGORY_MAP, CATEGORY_ORDER };
