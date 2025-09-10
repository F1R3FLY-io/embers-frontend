import type { EditorRef } from "@f1r3fly-io/lightning-bug";

import { Editor } from "@f1r3fly-io/lightning-bug";
import { RholangExtension } from "@f1r3fly-io/lightning-bug/extensions";
import {
  highlightsQueryUrl,
  indentsQueryUrl,
} from "@f1r3fly-io/lightning-bug/extensions/lang/rholang/tree-sitter/queries";
import { treeSitterWasmUrl } from "@f1r3fly-io/lightning-bug/tree-sitter";
import { wasm } from "@f1r3fly-io/tree-sitter-rholang-js-with-comments";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { CodeLayout } from "@/lib/layouts/Code";
import { useLayout } from "@/lib/providers/layout/useLayout";

import styles from "./CreateAiAgentFlow.module.scss";

const fileName = "agent.rho";
const logLevel = "trace"; // "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "report"

export default function CodeEditor() {
  const editorRef = useRef<EditorRef>(null);
  const { setHeaderTitle } = useLayout();
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHeaderTitle(t("aiAgent.bioAgent"));
  }, [setHeaderTitle, t]);

  useEffect(() => {
    if (ready && editorRef.current) {
      const editor = editorRef.current;
      editor.setLogLevel(logLevel);
      editor.openDocument(fileName);
      const events = editor.getEvents();
      events.subscribe(event => {
        if (event.type == "ready") {
          editor.openDocument(fileName);
        }
      });
    }
  }, [ready]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const checkReady = () => {
      if (editorRef.current?.isReady()) {
        setReady(true);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  }, []);

  // Handle Vite HMR updates: shutdown LSP before update, reconnect after
  if (import.meta.hot) {
    useEffect(() => {
      const handleBeforeUpdate = () => {
        if (editorRef.current && editorRef.current.isReady()) {
          editorRef.current.shutdownLsp();
        }
      };

      import.meta.hot.on('vite:beforeUpdate', handleBeforeUpdate);

      return () => {
        import.meta.hot.off('vite:beforeUpdate', handleBeforeUpdate);
      };
    }, []);
  }

  return (
    <CodeLayout>
      {/* to make a custom error layout later on */}
      <ErrorBoundary>
        <div className={styles.container}>
          <Editor
            ref={editorRef}
            languages={{
              rholang: {
                ...RholangExtension,
                grammarWasm: wasm,
                highlightsQueryPath: highlightsQueryUrl,
                indentsQueryPath: indentsQueryUrl,
              },
            }}
            treeSitterWasm={treeSitterWasmUrl}
          />
        </div>
      </ErrorBoundary>
    </CodeLayout>
  );
}
