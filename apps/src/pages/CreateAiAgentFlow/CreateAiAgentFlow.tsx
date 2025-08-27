// Optional lightning-bug components - loaded dynamically to avoid dependency errors
let Editor: any = null;
let RholangExtension: any = null;
// @ts-expect-error - EditorRef is assigned but not used, kept for future extension support  
let EditorRef: any = null;

// Function to load lightning-bug at runtime using conditional require
async function loadLightningBug() {
  return new Promise<void>((resolve) => {
    try {
      // Use eval to prevent Vite from trying to resolve these at build time
      const lightningBug = eval('require("@f1r3fly-io/lightning-bug")');
      const extensions = eval('require("@f1r3fly-io/lightning-bug/extensions")');
      Editor = lightningBug.Editor;
      RholangExtension = extensions.RholangExtension;
      EditorRef = lightningBug.EditorRef;
    } catch (error) {
      console.warn("Lightning-bug package not available. Code editor will be disabled.");
    }
    resolve();
  });
}
import { useEffect, useRef, useState } from "react";

import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { CodeLayout } from "@/lib/layouts/Code";
import { useLayout } from "@/lib/providers/layout/useLayout";

import styles from "./CreateAiAgentFlow.module.scss";

export default function CodeEditor() {
  const editorRef = useRef<any>(null);
  const { setHeaderTitle } = useLayout();
  const [isLightningBugLoaded, setIsLightningBugLoaded] = useState(false);
  
  // Load lightning-bug components dynamically
  useEffect(() => {
    loadLightningBug().then(() => {
      setIsLightningBugLoaded(true);
    });
  }, []);
  
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
          {!isLightningBugLoaded ? (
            <div style={{ color: '#666', padding: '2rem', textAlign: 'center' }}>
              <p>Loading code editor...</p>
            </div>
          ) : Editor ? (
            <Editor ref={editorRef} languages={{ rholang: RholangExtension }} />
          ) : (
            <div style={{ color: '#666', padding: '2rem', textAlign: 'center' }}>
              <p>Code editor not available.</p>
              <p>Install @f1r3fly-io/lightning-bug package for full functionality.</p>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </CodeLayout>
  );
}
