import type * as Blockly from "blockly/core";

const SVG_NS = "http://www.w3.org/2000/svg";
const GRADIENT_STYLE_ID = "blockly-gradient-styles";
const GRADIENT_SVG_ID = "blockly-gradient-defs";

/** Store for tracking created gradients */
const createdGradients = new Set<string>();

/** Reference to the style element */
let gradientStyle: HTMLStyleElement | null = null;

/** Reference to the shared SVG element for gradient defs */
let gradientSvg: SVGSVGElement | null = null;

/** Reference to the defs element inside the shared SVG */
let gradientDefs: SVGDefsElement | null = null;

/** MutationObserver for detecting new blocks */
let observer: MutationObserver | null = null;

/**
 * Converts a hex color to RGB components.
 */
function hexToRgb(hex: string): { b: number; g: number; r: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return null;
  }
  return {
    b: parseInt(result[3], 16),
    g: parseInt(result[2], 16),
    r: parseInt(result[1], 16),
  };
}

/**
 * Converts RGB components to hex color.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Creates a lighter version of a color (for gradient top).
 * Increases brightness by mixing with white.
 */
function lightenColor(hex: string, amount = 0.3): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }

  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount,
  );
}

/**
 * Creates a darker version of a color (for gradient bottom).
 * Decreases brightness by mixing with black.
 */
function darkenColor(hex: string, amount = 0.35): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }

  return rgbToHex(
    rgb.r * (1 - amount),
    rgb.g * (1 - amount),
    rgb.b * (1 - amount),
  );
}

/**
 * Generates a gradient ID from a hex color.
 */
function getGradientId(hex: string): string {
  // Remove # and create a valid ID
  return `gradient-${hex.replace("#", "").toLowerCase()}`;
}

/**
 * Creates an SVG linear gradient element for a given color.
 */
function createGradientElement(baseColor: string): SVGLinearGradientElement {
  const gradientId = getGradientId(baseColor);
  const lightColor = lightenColor(baseColor);
  const darkColor = darkenColor(baseColor);

  const linearGradient = document.createElementNS(SVG_NS, "linearGradient");
  linearGradient.setAttribute("id", gradientId);
  linearGradient.setAttribute("x1", "0%");
  linearGradient.setAttribute("y1", "0%");
  linearGradient.setAttribute("x2", "0%");
  linearGradient.setAttribute("y2", "100%");

  const stop1 = document.createElementNS(SVG_NS, "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", lightColor);

  const stop2 = document.createElementNS(SVG_NS, "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", darkColor);

  linearGradient.appendChild(stop1);
  linearGradient.appendChild(stop2);

  return linearGradient;
}

/**
 * Adds a CSS rule to apply a gradient to blocks with a specific fill color.
 */
function addGradientCssRule(baseColor: string): void {
  if (!gradientStyle) {
    return;
  }

  const gradientId = getGradientId(baseColor);
  const normalizedColor = baseColor.toLowerCase();

  // Add CSS rule for this specific color
  const rule = `.blocklyPath[fill="${normalizedColor}"] { fill: url(#${gradientId}) !important; }`;
  gradientStyle.textContent += `${rule}\n`;
}

/**
 * Creates or returns the shared SVG element for gradient definitions.
 * This SVG persists regardless of toolbox state.
 */
function getOrCreateSharedDefs(): SVGDefsElement {
  // Check if the shared SVG still exists in the DOM
  if (!gradientSvg || !gradientSvg.isConnected) {
    // Create a hidden SVG element to hold all gradient definitions
    gradientSvg = document.createElementNS(SVG_NS, "svg");
    gradientSvg.setAttribute("id", GRADIENT_SVG_ID);
    gradientSvg.setAttribute("width", "0");
    gradientSvg.setAttribute("height", "0");
    gradientSvg.style.position = "absolute";
    gradientSvg.style.visibility = "hidden";
    gradientSvg.style.pointerEvents = "none";

    gradientDefs = document.createElementNS(SVG_NS, "defs");
    gradientSvg.appendChild(gradientDefs);

    // Insert at the beginning of body so it's always available
    document.body.insertBefore(gradientSvg, document.body.firstChild);

    // Re-create all previously registered gradients
    createdGradients.forEach((color) => {
      const gradient = createGradientElement(color);
      gradientDefs!.appendChild(gradient);
    });
  }

  return gradientDefs!;
}

/**
 * Ensures a gradient exists for the given color.
 * Creates the gradient definition in the shared SVG and CSS rule if needed.
 */
function ensureGradientForColor(baseColor: string): void {
  const normalizedColor = baseColor.toLowerCase();

  // Skip invalid colors or already created gradients
  if (!hexToRgb(normalizedColor)) {
    return;
  }
  if (createdGradients.has(normalizedColor)) {
    return;
  }

  // Get the shared defs element
  const defs = getOrCreateSharedDefs();
  const gradientId = getGradientId(normalizedColor);

  // Check if gradient already exists (shouldn't happen, but safety check)
  if (!defs.querySelector(`#${gradientId}`)) {
    const gradient = createGradientElement(normalizedColor);
    defs.appendChild(gradient);
  }

  // Add CSS rule
  addGradientCssRule(normalizedColor);
  createdGradients.add(normalizedColor);
}

/**
 * Scans all Blockly SVGs for block paths and creates gradients for their colors.
 */
function scanAllSvgsForGradients(): void {
  // Find all SVGs that might contain blocks
  const allSvgs = document.querySelectorAll<SVGSVGElement>(
    "svg.blocklySvg, svg.blocklyFlyout",
  );

  allSvgs.forEach((svg) => {
    const blockPaths = svg.querySelectorAll(".blocklyPath[fill]");
    blockPaths.forEach((path) => {
      const fill = path.getAttribute("fill");
      if (fill && fill.startsWith("#")) {
        ensureGradientForColor(fill);
      }
    });
  });
}

/**
 * Sets up a MutationObserver to detect new blocks and apply gradients.
 */
function setupObserver(container: Element): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    // Debounce scanning to avoid excessive updates
    scanAllSvgsForGradients();
  });

  // Observe the entire container for any changes
  observer.observe(container, {
    attributeFilter: ["fill"],
    attributes: true,
    childList: true,
    subtree: true,
  });
}

/**
 * Initializes the gradient system for a Blockly workspace.
 * Dynamically creates gradients based on actual block colors.
 *
 * @param workspace - The Blockly workspace to apply gradients to
 */
export function applyBlockGradients(workspace: Blockly.WorkspaceSvg): void {
  // Find the container element (parent of all Blockly SVGs)
  const container = workspace.getParentSvg().parentElement;
  if (!container) {
    return;
  }

  // Create style element if not exists
  if (!gradientStyle || !gradientStyle.isConnected) {
    gradientStyle = document.createElement("style");
    gradientStyle.id = GRADIENT_STYLE_ID;
    document.head.appendChild(gradientStyle);

    // Re-add CSS rules for already created gradients
    createdGradients.forEach((color) => {
      addGradientCssRule(color);
    });
  }

  // Ensure the shared gradient SVG exists
  getOrCreateSharedDefs();

  // Initial scan for existing blocks in all SVGs
  scanAllSvgsForGradients();

  // Setup observer for new blocks on the container
  setupObserver(container);
}

/**
 * Removes gradient styles and stops observing.
 */
export function removeBlockGradients(): void {
  // Stop observer
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // Remove style element
  if (gradientStyle) {
    gradientStyle.remove();
    gradientStyle = null;
  }

  // Remove the shared gradient SVG
  if (gradientSvg) {
    gradientSvg.remove();
    gradientSvg = null;
    gradientDefs = null;
  }

  // Clear tracking set
  createdGradients.clear();
}
