import type { OSLFInstance } from "@f1r3fly-io/oslf-editor";

import { Events, init, oslfBlocks } from "@f1r3fly-io/oslf-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OSLFLayout } from "@/lib/layouts/OSLF";

import styles from "./GraphOSLF.module.scss";

type Props = {
  onChange?: (payload: { code: string; state: object }) => void;
};

type ViewMode = "graph" | "outline" | "tree";

export function OSLFEditorView({ onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<OSLFInstance | null>(null);

  const [view, setView] = useState<ViewMode>("graph");

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
      const { code, state } = (event as CustomEvent).detail ?? {};
      onChange?.({ code: code || "", state: state || {} });
    };

    window.addEventListener(Events.ON_CHANGE, handleChange);

    return () => {
      window.removeEventListener(Events.ON_CHANGE, handleChange);
      instanceRef.current = null;
    };
  }, [onChange]);

  const topRight = useMemo(() => {
    const btnClass = (mode: ViewMode) =>
      view === mode
        ? styles["oslf-segment-btn-active"]
        : styles["oslf-segment-btn"];

    return (
      <div className={styles["oslf-top-right"]}>
        <div className={styles["oslf-segment"]}>
          <button
            className={btnClass("graph")}
            type="button"
            onClick={() => setView("graph")}
          >
            Graph View
          </button>
          <button
            className={btnClass("outline")}
            type="button"
            onClick={() => setView("outline")}
          >
            Outline View
          </button>
          <button
            className={btnClass("tree")}
            type="button"
            onClick={() => setView("tree")}
          >
            Tree View
          </button>
        </div>
      </div>
    );
  }, [view]);

  return (
    <div className={styles["oslf-editor-shell"]}>
      <div ref={containerRef} className={styles["oslf-editor-mount"]} />
      {topRight}

      {view !== "graph" && (
        <div className={styles["oslf-overlay"]}>
          <div className={styles["oslf-overlay-header"]}>
            <div className={styles["oslf-overlay-title"]}>
              {view === "outline" ? "Outline View" : "Tree View"}
            </div>
            <button
              className={styles["oslf-overlay-close"]}
              type="button"
              onClick={() => setView("graph")}
            >
              ×
            </button>
          </div>
          <div className={styles["oslf-overlay-body"]}>
            Render your outline here
          </div>
        </div>
      )}
    </div>
  );
}

export default function GraphOSLF() {
  const handleChange = useCallback(
    ({ code, state }: { code: string; state: object }) => {
      console.log("OSLF code:", code);
      console.log("OSLF state:", state);
    },
    [],
  );

  return (
    <OSLFLayout>
      <div className={styles["oslf-root"]}>
        <OSLFEditorView onChange={handleChange} />
      </div>
    </OSLFLayout>
  );
}
