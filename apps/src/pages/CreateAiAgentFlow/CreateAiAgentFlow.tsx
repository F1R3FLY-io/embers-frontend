// Optional import for lightning-bug - fallback if not available
let Editor: any = null;
let RholangExtension: any = null;
// @ts-expect-error - EditorRef is assigned but not used, kept for future extension support
let EditorRef: any = null;

try {
  const lightningBug = require("@f1r3fly-io/lightning-bug");
  const extensions = require("@f1r3fly-io/lightning-bug/extensions");
  Editor = lightningBug.Editor;
  RholangExtension = extensions.RholangExtension;
  EditorRef = lightningBug.EditorRef;
} catch (error) {
  console.warn("Lightning-bug package not available. Code editor will be disabled.");
}
import { useEffect, useRef } from "react";

import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { CodeLayout } from "@/lib/layouts/Code";
import { useLayout } from "@/lib/providers/layout/useLayout";

import styles from "./CreateAiAgentFlow.module.scss";

export default function CodeEditor() {
  const editorRef = useRef<any>(null);
  const { setHeaderTitle } = useLayout();
  
  useEffect(() => {
    setHeaderTitle("BioMatch Agent");
    
    if (!Editor || !editorRef.current) {
      return;
    }

    const interval = setInterval(() => {
      if (editorRef.current?.isReady()) {
        clearInterval(interval);

        editorRef.current.openDocument(
          "demo.rho",
          'new x in { x!("Hello") | Nil }',
          "rholang",
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [setHeaderTitle]);

  return (
    <CodeLayout>
      <ErrorBoundary>
        <div className={styles.container}>
          {Editor ? (
            <Editor ref={editorRef} languages={{ rholang: RholangExtension }} />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              <p>Code editor not available.</p>
              <p>Install @f1r3fly-io/lightning-bug package for full functionality.</p>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </CodeLayout>
  );
}
