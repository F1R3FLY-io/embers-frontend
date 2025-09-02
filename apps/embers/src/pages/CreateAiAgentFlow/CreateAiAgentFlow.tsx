import type { EditorRef } from "@f1r3fly-io/lightning-bug";

import { Editor } from "@f1r3fly-io/lightning-bug";
import { RholangExtension } from "@f1r3fly-io/lightning-bug/extensions";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { CodeLayout } from "@/lib/layouts/Code";
import { useLayout } from "@/lib/providers/layout/useLayout";

import styles from "./CreateAiAgentFlow.module.scss";

export default function CodeEditor() {
  const editorRef = useRef<EditorRef>(null);
  const { setHeaderTitle } = useLayout();
  const { t } = useTranslation();

  useEffect(() => {
    setHeaderTitle(t("aiAgent.bioAgent"));

    if (!editorRef.current) {
      return;
    }

    const interval = setInterval(() => {
      if (editorRef.current?.isReady()) {
        clearInterval(interval);
        editorRef.current.openDocument("demo.rho");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [setHeaderTitle, t]);

  return (
    <CodeLayout>
      {/* to make a custom error layout later on */}
      <ErrorBoundary>
        <div className={styles.container}>
          <Editor ref={editorRef} languages={{ rholang: RholangExtension }} />
        </div>
      </ErrorBoundary>
    </CodeLayout>
  );
}
