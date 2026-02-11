import type { OSLFInstance } from "@f1r3fly-io/oslf-editor";

import { Events, init, oslfBlocks } from "@f1r3fly-io/oslf-editor";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { OSLFEditorStepperData } from "@/lib/providers/stepper/flows/OSLFEditor";

import { OSLFLayout } from "@/lib/layouts/OSLF";
import { useOSLFEditorStepper } from "@/lib/providers/stepper/flows/OSLFEditor";

import styles from "./GraphOSLF.module.scss";

type ViewMode = "graph" | "outline" | "tree";

export default function GraphOSLF() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<OSLFInstance | null>(null);
  const { data, updateData, updateMany } = useOSLFEditorStepper();
  const [view, setView] = useState<ViewMode>("graph");
  const location = useLocation();
  const navigate = useNavigate();

  // const { data: query } = useOslf(data.id, data.version);

  useEffect(() => {
    const preload = location.state as OSLFEditorStepperData;
    updateMany(preload);
    void navigate(location.pathname, { replace: true });
    // disabling because I need to run it only ONCE
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const { code } = (event as CustomEvent<{ code: string; state: string }>)
        .detail;
      updateData("query", code);
    };

    window.addEventListener(Events.ON_CHANGE, handleChange);

    return () => {
      window.removeEventListener(Events.ON_CHANGE, handleChange);
      instanceRef.current = null;
    };
  }, [updateData]);

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
    <OSLFLayout title={data.name}>
      <div className={styles["oslf-root"]}>
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
      </div>
    </OSLFLayout>
  );
}
