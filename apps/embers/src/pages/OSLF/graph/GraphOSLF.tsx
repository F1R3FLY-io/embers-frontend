import type * as Blockly from "blockly/core";

import { OSLFEditor } from "@f1r3fly-io/oslf-editor";
import { useCallback, useState } from "react";

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
} as const;

export default function GraphOSLF() {

  const handleWorkspaceInit = useCallback((ws: Blockly.WorkspaceSvg) => {
    console.log("OSLF Editor initialized:", ws);
  }, []);

  const handleWorkspaceChange = useCallback((ws: Blockly.WorkspaceSvg) => {
    console.log("OSLF Editor changed:", ws);
  }, []);

  return (
    <OSLFEditor
      style={{ height: "100%", width: "100%" }}
      toolbox={DEFAULT_TOOLBOX}
      onChange={handleWorkspaceChange}
      onInit={handleWorkspaceInit}
    />
  );
}