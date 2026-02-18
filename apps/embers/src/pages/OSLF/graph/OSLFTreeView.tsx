import { useMemo } from "react";

import styles from "./GraphOSLF.module.scss";

function buildTreeLines(state: any) {
  const root = state?.blocks?.blocks?.[0];

  if (!root) {
    return [
      { kind: "structure", text: "Structure: (empty)" },
      { kind: "structure", text: "└─ Add blocks to see tree view" },
    ];
  }

  const type = String(root?.type ?? "unknown");

  return [
    { kind: "structure", text: `Structure: ${type}` },
    { kind: "collection", text: "└─ Collection: ..." },
    { kind: "structure", text: "   └─ Structure: ..." },
    { kind: "behavior", text: "      └─ Behavior: ..." },
  ];
}

type Props = {
  state: object | null;
};

export function OSLFTreeView({ state }: Props) {
  const lines = useMemo(() => buildTreeLines(state), [state]);

  return (
    <div className={styles["oslf-tree"]}>
      {lines.map((l, idx) => {
        const className =
          l.kind === "structure"
            ? styles["oslf-tree-structure"]
            : l.kind === "collection"
              ? styles["oslf-tree-collection"]
              : styles["oslf-tree-behavior"];

        return (
          <div key={idx} className={className}>
            {l.text}
          </div>
        );
      })}
    </div>
  );
}
