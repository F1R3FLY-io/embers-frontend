import * as Blockly from "blockly/core";

// Color palette for the OSLF Editor theme
const Colors = {
  arithmetic: 20, // Red-orange
  collections: 320, // Pink
  comparison: 140, // Green-blue

  composition: 340, // Magenta
  control: 208, // Blue
  declarations: 180, // Cyan
  flyout: "#161E27",
  // Block category colors (HSV values)
  ground: 160, // Green tint
  insertionMarker: "#000000",
  insertionMarkerOpacity: 0.2,
  logical: 260, // Violet
  methods: 100, // Yellow-green
  names: 280, // Purple
  // Primary colors
  primary: "#208bfe",
  primaryDark: "#0066cc",
  primaryLight: "#4ea3ff",

  processes: 208, // Blue
  receipts: 40, // Orange
  scrollbar: "#cccccc",
  scrollbarOpacity: 0.4,
  sendReceive: 60, // Yellow
  // Text colors
  text: "#000000",
  textSecondary: "#ffffff",

  toolbox: "#161E27",
  // UI colors
  workspace: "#161E27",
};

// Define block styles for different categories
const blockStyles = {
  arithmetic_blocks: {
    colourPrimary: "#ff6b35",
    colourSecondary: "#d9592c",
    colourTertiary: "#b34924",
  },
  collection_blocks: {
    colourPrimary: "#ff6680",
    colourSecondary: "#d94f6b",
    colourTertiary: "#b34256",
  },
  comparison_blocks: {
    colourPrimary: "#40bf86",
    colourSecondary: "#359f6f",
    colourTertiary: "#2c8259",
  },
  composition_blocks: {
    colourPrimary: "#ff4da6",
    colourSecondary: "#d93f8a",
    colourTertiary: "#b33371",
  },
  control_blocks: {
    colourPrimary: "#208bfe",
    colourSecondary: "#1a73d8",
    colourTertiary: "#155db3",
  },
  declaration_blocks: {
    colourPrimary: "#00c9c9",
    colourSecondary: "#00a7a7",
    colourTertiary: "#008686",
  },
  ground_blocks: {
    colourPrimary: "#5cb85c",
    colourSecondary: "#4a9d4a",
    colourTertiary: "#3d8b3d",
  },
  logical_blocks: {
    colourPrimary: "#a366ff",
    colourSecondary: "#8852d9",
    colourTertiary: "#6f42b3",
  },
  method_blocks: {
    colourPrimary: "#c4d91f",
    colourSecondary: "#a3b619",
    colourTertiary: "#859414",
  },
  name_blocks: {
    colourPrimary: "#9966ff",
    colourSecondary: "#7f52d9",
    colourTertiary: "#6640b3",
  },
  process_blocks: {
    colourPrimary: "#4d97ff",
    colourSecondary: "#3d7fd9",
    colourTertiary: "#3268b3",
  },
  receipt_blocks: {
    colourPrimary: "#ffab19",
    colourSecondary: "#d98f15",
    colourTertiary: "#b37612",
  },
  send_receive_blocks: {
    colourPrimary: "#ffcc00",
    colourSecondary: "#d9ad00",
    colourTertiary: "#b38f00",
  },
};

// Define category styles for the toolbox
const categoryStyles = {
  arithmetic_category: {
    colour: "#ff6b35",
  },
  collections_category: {
    colour: "#ff6680",
  },
  comparison_category: {
    colour: "#40bf86",
  },
  composition_category: {
    colour: "#ff4da6",
  },
  control_category: {
    colour: "#208bfe",
  },
  declarations_category: {
    colour: "#00c9c9",
  },
  ground_category: {
    colour: "#5cb85c",
  },
  logical_category: {
    colour: "#a366ff",
  },
  methods_category: {
    colour: "#c4d91f",
  },
  names_category: {
    colour: "#9966ff",
  },
  processes_category: {
    colour: "#4d97ff",
  },
  receipts_category: {
    colour: "#ffab19",
  },
  send_receive_category: {
    colour: "#ffcc00",
  },
};

// Component styles for workspace, toolbox, etc.
const componentStyles = {
  // Cursor and marker colors for keyboard navigation
  cursorColour: "#cc0000",
  flyoutBackgroundColour: Colors.flyout,
  flyoutForegroundColour: Colors.text,
  flyoutOpacity: 0.95,
  insertionMarkerColour: Colors.insertionMarker,
  insertionMarkerOpacity: Colors.insertionMarkerOpacity,
  markerColour: "#4d97ff",
  scrollbarColour: Colors.scrollbar,
  scrollbarOpacity: Colors.scrollbarOpacity,
  toolboxBackgroundColour: Colors.toolbox,

  toolboxForegroundColour: Colors.textSecondary,
  workspaceBackgroundColour: Colors.workspace,
};

// Font style for the theme
const fontStyle = {
  family:
    "'Manrope', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
  size: 12,
  weight: "700",
};

// Create and export the custom theme
export const OslfTheme = Blockly.Theme.defineTheme("oslf_theme", {
  blockStyles,
  categoryStyles,
  componentStyles,
  fontStyle,
  name: "OSLF Editor Theme",
  startHats: false, // Enable hat blocks for top-level blocks
});

export default OslfTheme;
