import type { OSLFInstance } from "@f1r3fly-io/oslf-editor";
import type * as Blockly from "blockly/core";
import type React from "react";

import {
  createBlockAtClientPoint,
  Events,
  init,
  oslfBlocks,
  registerOslfBlocks,
} from "@f1r3fly-io/oslf-editor";
import { useCallback, useEffect, useRef, useState } from "react";

import { OSLFLayout } from "@/lib/layouts/OSLF";

export default function GraphOSLF() {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<ReturnType<typeof init> | null>(null);

  const [workspace, setWorkspace] = useState<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    const el = editorContainerRef.current;
    if (!el) {
      return;
    }

    // Prevent double-init (React StrictMode/dev can mount effects twice)
    if (instanceRef.current) {
      return;
    }

    const instance = init(el);
    instanceRef.current = instance;

    setWorkspace(instance.workspace);

    // ✅ Register blocks & load them (payload must be an array of blocks)
    registerOslfBlocks(oslfBlocks);
    el.dispatchEvent(new CustomEvent(Events.INIT, { detail: oslfBlocks }));

    return () => {
      // If you have a dispose method on instance, call it here.
      // instanceRef.current?.dispose?.();
      instanceRef.current = null;
      setWorkspace(null);
    };
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!workspace) {
        return;
      }

      const type = e.dataTransfer.getData("application/x-oslf-block");
      if (!type) {
        return;
      }

      createBlockAtClientPoint(workspace, type, e.clientX, e.clientY);
    },
    [workspace],
  );

  return (
    <OSLFLayout>
      <div
        style={{ height: "100%", width: "100%" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div
          ref={editorContainerRef}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </OSLFLayout>
  );
}
