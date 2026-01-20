import type * as Blockly from "blockly/core";

import { useEffect, useRef } from "react";

import { initEditor } from "../core/initEditor";

export type OSLFEditorProps = {
	className?: string;
	containerId?: string;
	onChange?: (workspace: Blockly.WorkspaceSvg) => void;
	onInit?: (workspace: Blockly.WorkspaceSvg) => void;
	style?: React.CSSProperties;
	toolbox: Blockly.utils.toolbox.ToolboxDefinition;
};

/**
 * OSLFEditor - A React component wrapper for Blockly-based OSLF editor.
 *
 * This component manages a Blockly workspace instance and provides
 * props-based configuration for toolbox, change handlers, and styling.
 *
 * @example
 * ```tsx
 * import { OSLFEditor } from '@f1r3fly-io/oslf-editor';
 * import '@f1r3fly-io/oslf-editor/styles';
 *
 * function MyEditor() {
 *   const [workspace, setWorkspace] = useState<Blockly.WorkspaceSvg | null>(null);
 *
 *   return (
 *     <OSLFEditor
 *       toolbox={myToolboxConfig}
 *       onInit={(ws) => setWorkspace(ws)}
 *       onChange={(ws) => console.log('Workspace changed:', ws)}
 *     />
 *   );
 * }
 * ```
 */
export function OSLFEditor({
	className,
	containerId,
	onChange,
	onInit,
	style,
	toolbox,
}: OSLFEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
	const changeListenerRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const container = containerId ?? containerRef.current;

		if (!container) {
			//console.error("OSLFEditor: No container available for Blockly workspace");
			return;
		}

		const workspace = initEditor(container, toolbox);
		workspaceRef.current = workspace;

		if (onInit) {
			onInit(workspace);
		}

		if (onChange) {
			const listener = () => {
				onChange(workspace);
			};
			workspace.addChangeListener(listener);
			changeListenerRef.current = listener;
		}

		return () => {
			if (changeListenerRef.current && workspaceRef.current) {
				workspaceRef.current.removeChangeListener(changeListenerRef.current);
				changeListenerRef.current = null;
			}

			if (workspaceRef.current) {
				workspaceRef.current.dispose();
				workspaceRef.current = null;
			}
		};
	}, [containerId, toolbox, onChange, onInit]);

	if (containerId) {
		return null;
	}

	return <div ref={containerRef} className={className} style={style} />;
}
