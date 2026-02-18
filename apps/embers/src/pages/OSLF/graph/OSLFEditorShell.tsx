import type { OSLFInstance } from "@f1r3fly-io/oslf-editor";

import { Events, init, oslfBlocks } from "@f1r3fly-io/oslf-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "./GraphOSLF.module.scss";
import { OSLFOutlineView } from "./OSLFOutlineView";
import { OSLFTreeView } from "./OSLFTreeView";

type ViewMode = "graph" | "outline" | "tree";

type OSLFChangeDetail = {
  code: string;
  state: object;
};

type Props = {
  onChange?: (payload: { code: string; state: object }) => void;
};

export function OSLFEditorShell({ onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<OSLFInstance | null>(null);

  const [view, setView] = useState<ViewMode>("graph");
  const [lastCode, setLastCode] = useState<string>("");
  const [lastState, setLastState] = useState<object | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    if (instanceRef.current) {
      return;
    }

    instanceRef.current = init(el);
    el.dispatchEvent(new CustomEvent(Events.INIT, { detail: oslfBlocks }));

    const handleChange = (event: Event) => {
      const { code, state } = (event as CustomEvent<OSLFChangeDetail>).detail;
      const safeCode = code || "";
      const safeState = state || {};

      setLastCode(safeCode);
      setLastState(safeState);
      onChange?.({ code: safeCode, state: safeState });
    };

    window.addEventListener(Events.ON_CHANGE, handleChange);

    return () => {
      window.removeEventListener(Events.ON_CHANGE, handleChange);
      instanceRef.current = null;
    };
  }, [onChange]);

  const btnClass = useMemo(() => {
    return (mode: ViewMode) =>
      view === mode
        ? styles["oslf-segment-btn-active"]
        : styles["oslf-segment-btn"];
  }, [view]);

  const frameTitle = useMemo(() => {
    if (view === "outline") {
      return "Outline View";
    }
    if (view === "tree") {
      return "Tree View";
    }
    return "";
  }, [view]);

  const onGraph = useCallback(() => setView("graph"), []);
  const onOutline = useCallback(() => setView("outline"), []);
  const onTree = useCallback(() => setView("tree"), []);

  return (
    <div className={styles["oslf-editor-shell"]}>
      <div
        ref={containerRef}
        className={[
          styles["oslf-editor-mount"],
          view === "graph" ? "" : styles["oslf-editor-mount-hidden"],
        ].join(" ")}
      />

      {view !== "graph" && (
        <div className={styles["oslf-view-frame"]}>
          <div className={styles["oslf-view-frame-header"]}>
            <div className={styles["oslf-view-frame-title"]}>{frameTitle}</div>
          </div>

          <div className={styles["oslf-view-frame-body"]}>
            {view === "tree" ? (
              <OSLFTreeView state={lastState} />
            ) : (
              <OSLFOutlineView code={lastCode} />
            )}
          </div>
        </div>
      )}

      <div className={styles["oslf-top-right"]}>
        <div className={styles["oslf-segment"]}>
          <button className={btnClass("graph")} type="button" onClick={onGraph}>
            Graph View
          </button>
          <button
            className={btnClass("outline")}
            type="button"
            onClick={onOutline}
          >
            Outline View
          </button>
          <button className={btnClass("tree")} type="button" onClick={onTree}>
            Tree View
          </button>
        </div>
      </div>
    </div>
  );
}
