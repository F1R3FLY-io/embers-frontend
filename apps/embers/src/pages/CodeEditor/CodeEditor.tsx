import type {EditorRef} from "@f1r3fly-io/lightning-bug";

import { Editor  } from "@f1r3fly-io/lightning-bug";
import { RholangExtension } from "@f1r3fly-io/lightning-bug/extensions";
import { useEffect, useRef } from "react";

import { ErrorBoundary } from "@/lib/errorBoundary.ts";
import { useLayout } from "@/lib/providers/layout/useLayout.ts";

import DefaultLayout from "../../lib/components/Layouts/Code";
import styles from "./CodeEditor.module.scss";

export default function CodeEditor() {
  const editorRef = useRef<EditorRef>(null);
  const { setHeaderTitle } = useLayout();
  useEffect(() => {
    setHeaderTitle("BioMatch Agent");
    if (!editorRef.current) {
      return;
    }

    const interval = setInterval(() => {
      if (editorRef.current?.isReady()) {
        clearInterval(interval);

        editorRef.current.openDocument(
          "demo.rho",
          'new x in { x!("Hello") | Nil }',
          "rholang"
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <DefaultLayout>
      {/* to make a custom error layout later on */}
      <ErrorBoundary>
        <div className={styles.container}>
          <Editor
            ref={editorRef}
            languages={{ rholang: RholangExtension }}
          />
        </div>
      </ErrorBoundary>
    </DefaultLayout>
  );
}