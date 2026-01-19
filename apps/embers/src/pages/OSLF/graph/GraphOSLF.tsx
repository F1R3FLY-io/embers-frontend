import type { OSLFInstance } from "@f1r3fly-io/oslf-editor";

import { Events, init } from "@f1r3fly-io/oslf-editor";
import { useCallback, useEffect, useRef, useState } from "react";

export default function GraphOSLF() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<OSLFInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    editorRef.current = init(containerRef.current);

    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Workspace changed:", customEvent.detail?.state);
    };

    window.addEventListener(Events.ON_CHANGE, handleChange);

    return () => {
      window.removeEventListener(Events.ON_CHANGE, handleChange);
      editorRef.current = null;
    };
  }, []);


  return <div ref={containerRef} id="blockly" />;
}