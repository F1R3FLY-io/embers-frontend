import classNames from "classnames";
import { useMemo } from "react";

import type { OslfBlock, OslfWorkspaceState } from "./OSLFStateCoerce";

import styles from "./GraphOSLF.module.scss";

type TreeLineKind = "structure" | "collection" | "behavior";

type TreeLine = {
  kind: TreeLineKind;
  text: string;
};

type Props = {
  state: OslfWorkspaceState | null;
};

function labelForBlock(block: OslfBlock): {
  kind: TreeLineKind;
  label: string;
} {
  const t = block.type;

  if (t.startsWith("proc_")) {
    if (t === "proc_output") {
      return { kind: "structure", label: "Structure: Output (!)" };
    }
    if (t === "proc_input") {
      return { kind: "structure", label: "Structure: Input (for)" };
    }
    if (t === "proc_par") {
      return { kind: "structure", label: "Structure: Parallel ({ })" };
    }
    if (t === "proc_zero") {
      return { kind: "behavior", label: "Behavior: Zero = 0" };
    }
    if (t === "proc_var") {
      const v = block.fields?.VAR ?? "v";
      return { kind: "behavior", label: `Behavior: Proc Var = ${v}` };
    }
    return { kind: "structure", label: `Structure: ${t}` };
  }

  if (t.startsWith("name_")) {
    if (t === "name_quote") {
      return { kind: "collection", label: "Collection: Quote (@)" };
    }
    if (t === "name_var") {
      const v = block.fields?.VAR ?? "v";
      return { kind: "collection", label: `Collection: Name Var = ${v}` };
    }
    return { kind: "collection", label: `Collection: ${t}` };
  }

  return { kind: "structure", label: `Structure: ${t}` };
}

function inputOrder(block: OslfBlock): string[] {
  switch (block.type) {
    case "proc_output":
      return ["CHANNEL", "MESSAGE"];
    case "name_quote":
      return ["BODY"];
    default:
      return block.inputs ? Object.keys(block.inputs) : [];
  }
}

function inputLabel(blockType: string, inputName: string): string {
  if (blockType === "proc_output" && inputName === "CHANNEL") {
    return "Structure: Channel";
  }
  if (blockType === "proc_output" && inputName === "MESSAGE") {
    return "Behavior: Payload";
  }
  if (blockType === "name_quote" && inputName === "BODY") {
    return "Behavior: Body";
  }
  return `Structure: ${inputName}`;
}

function pushLines(
  lines: TreeLine[],
  prefix: string,
  isLast: boolean,
  kind: TreeLineKind,
  text: string,
) {
  const branch = isLast ? "└─ " : "├─ ";
  lines.push({ kind, text: `${prefix}${branch}${text}` });
}

function walkBlock(lines: TreeLine[], block: OslfBlock, prefix: string) {
  const orderedInputs = inputOrder(block);
  const inputs = block.inputs;

  if (!inputs || orderedInputs.length === 0) {
    return;
  }

  const existing = orderedInputs.filter((k) => inputs[k]?.block);

  existing.forEach((inputName, idx) => {
    const child = inputs[inputName]?.block;
    if (!child) {
      return;
    }

    const isLast = idx === existing.length - 1;

    const inputLine = inputLabel(block.type, inputName);
    pushLines(lines, prefix, false, "structure", inputLine);

    const nextPrefix = `${prefix}${isLast ? "   " : "│  "}`;

    const { kind, label } = labelForBlock(child);
    pushLines(lines, prefix, isLast, kind, label);

    walkBlock(lines, child, nextPrefix);
  });
}

function buildTree(state: OslfWorkspaceState | null): TreeLine[] {
  if (!state) {
    return [
      { kind: "structure", text: "Structure: (empty)" },
      { kind: "structure", text: "└─ Add blocks to see tree view" },
    ];
  }

  const root = state.blocks.blocks[0];

  const { kind, label } = labelForBlock(root);

  const lines: TreeLine[] = [{ kind, text: label }];

  walkBlock(lines, root, "");
  return lines;
}

export function OSLFTreeView({ state }: Props) {
  const lines = useMemo(() => buildTree(state), [state]);

  return (
    <div className={styles["oslf-tree"]}>
      {lines.map((l, idx) => (
        <div
          key={idx}
          className={classNames({
            [styles["oslf-tree-behavior"]]: l.kind === "behavior",
            [styles["oslf-tree-collection"]]: l.kind === "collection",
            [styles["oslf-tree-structure"]]: l.kind === "structure",
          })}
        >
          {l.text}
        </div>
      ))}
    </div>
  );
}
