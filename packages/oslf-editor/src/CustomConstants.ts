import * as Blockly from "blockly/core";

/** Notch dimensions for triangular connectors */
const NOTCH_WIDTH = 8;
const NOTCH_HEIGHT = 4;

/** Puzzle tab dimensions for triangular connectors */
const TAB_WIDTH = 8;
const TAB_HEIGHT = 10;

/** Shape type constants (matching Blockly's internal values) */
const SHAPE_NOTCH = 1;
const SHAPE_PUZZLE = 2;

/**
 * Custom constant provider for OSLF blocks with triangular connectors.
 */
export class CustomConstantProvider
  extends Blockly.blockRendering.ConstantProvider
{
  CORNER_RADIUS = 4;

  /**
   * Create triangular notch for statement connections (top/bottom of blocks).
   */
  protected override makeNotch(): {
    height: number;
    pathLeft: string;
    pathRight: string;
    type: number;
    width: number;
  } {
    const width = NOTCH_WIDTH;
    const height = NOTCH_HEIGHT;

    // Triangular notch pointing down (original direction)
    // pathLeft: draws the notch when going left-to-right (top of block)
    // pathRight: draws the notch when going right-to-left (bottom of block)
    const pathLeft = `l ${width / 2},${height} l ${width / 2},-${height}`;
    const pathRight = `l -${width / 2},${height} l -${width / 2},-${height}`;

    return {
      height,
      pathLeft,
      pathRight,
      type: SHAPE_NOTCH,
      width,
    };
  }

  /**
   * Create triangular puzzle tab for value connections (side of blocks).
   */
  protected override makePuzzleTab(): {
    height: number;
    pathDown: string;
    pathUp: string;
    type: number;
    width: number;
  } {
    const width = TAB_WIDTH;
    const height = TAB_HEIGHT;

    // Triangular tab pointing left (inward, reversed)
    // pathDown: draws the tab when going top-to-bottom
    // pathUp: draws the tab when going bottom-to-top
    const pathDown = `l -${width},${height / 2} l ${width},${height / 2}`;
    const pathUp = `l -${width},-${height / 2} l ${width},-${height / 2}`;

    return {
      height,
      pathDown,
      pathUp,
      type: SHAPE_PUZZLE,
      width,
    };
  }
}
