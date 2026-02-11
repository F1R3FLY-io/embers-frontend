import * as Blockly from "blockly/core";

export function createBlockAtClientPoint(
  workspace: Blockly.WorkspaceSvg,
  type: string,
  clientX: number,
  clientY: number,
) {
  const svg = workspace.getParentSvg();

  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;

  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return;
  }

  const domPoint = pt.matrixTransform(ctm.inverse());

  const svgPoint = new Blockly.utils.Coordinate(domPoint.x, domPoint.y);

  const wsPoint = Blockly.utils.svgMath.screenToWsCoordinates(
    workspace,
    svgPoint,
  );

  const block = workspace.newBlock(type);
  block.initSvg();
  block.render();
  block.moveBy(wsPoint.x, wsPoint.y);

  return block;
}
