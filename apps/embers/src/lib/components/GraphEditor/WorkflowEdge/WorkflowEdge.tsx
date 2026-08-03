import type { EdgeProps } from "@xyflow/react";

import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

import type { WorkflowEdgeData } from "@/lib/workflow";

import { edgeAnnotation } from "./edgeAnnotation";
import styles from "./WorkflowEdge.module.scss";

// The editor's only edge type. The stored descriptive label (the portable
// document's presentation string) is deliberately NOT rendered -- it survives
// as the annotation's accessible name -- and the visual layer shows only the
// compact symbolic form, floated just above the path with no background.
export function WorkflowEdge({
  data,
  id,
  interactionWidth,
  label,
  markerEnd,
  markerStart,
  sourcePosition,
  sourceX,
  sourceY,
  style,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });
  const annotation = edgeAnnotation(data as WorkflowEdgeData | undefined);

  return (
    <>
      <BaseEdge
        id={id}
        interactionWidth={interactionWidth}
        markerEnd={markerEnd}
        markerStart={markerStart}
        path={path}
        style={style}
      />
      {annotation !== null && (
        <EdgeLabelRenderer>
          <div
            aria-label={typeof label === "string" ? label : undefined}
            className={styles.annotation}
            role="note"
            style={{
              transform: `translate(-50%, -100%) translate(${String(labelX)}px, ${String(labelY - 6)}px)`,
            }}
            title={typeof label === "string" ? label : undefined}
          >
            {annotation}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
