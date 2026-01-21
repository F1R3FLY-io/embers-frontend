import type { OSLFInstance } from "@f1r3fly-io/oslf-editor";

import { Events, init, oslfBlocks } from "@f1r3fly-io/oslf-editor";
import { useCallback, useEffect, useRef } from "react";

import { OSLFLayout } from "@/lib/layouts/OSLF";

type Props = {
  onChange?: (payload: { code: string; state: object }) => void;
};

export function OSLFEditorView({ onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<OSLFInstance | null>(null);

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

    // 3) listen to changes (demo style: global event)
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

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
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
      <div style={{ height: "100%", width: "100%" }}>
        <OSLFEditorView onChange={handleChange} />
      </div>
    </OSLFLayout>
  );
}
