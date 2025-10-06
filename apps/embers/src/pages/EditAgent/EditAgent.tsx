import type { EditorRef } from "@f1r3fly-io/lightning-bug";

import { Editor } from "@f1r3fly-io/lightning-bug";
import { RholangExtension } from "@f1r3fly-io/lightning-bug/extensions";
import {
  highlightsQueryUrl,
  indentsQueryUrl,
} from "@f1r3fly-io/lightning-bug/extensions/lang/rholang/tree-sitter/queries";
import { treeSitterWasmUrl } from "@f1r3fly-io/lightning-bug/tree-sitter";
import { wasm } from "@f1r3fly-io/tree-sitter-rholang-js-with-comments";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { CodeLayout } from "@/lib/layouts/Code";
import { useLayout } from "@/lib/providers/layout/useLayout";
import { useStepper } from "@/lib/providers/stepper/useStepper";
import { useAgent } from "@/lib/queries";

import styles from "./EditAgent.module.scss";

const fileName = "agent.rho";
const logLevel = "trace"; // "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "report"

export default function CodeEditor() {
  const editorRef = useRef<EditorRef>(null);
  const { t } = useTranslation();
  const { setHeaderTitle } = useLayout();
  const { data } = useStepper();
  const { agentId, version } = data;
  const { data: agent } = useAgent(agentId, version);
  const search = new URLSearchParams(useLocation().search);

  const agentName = agent?.name || search.get("agentName");

  useEffect(
    () => setHeaderTitle(t("agents.agentWithName", { name: agentName })),
    [agentName, setHeaderTitle, t],
  );

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.setLogLevel(logLevel);
      const events = editor.getEvents();
      const subscription = events.subscribe((event) => {
        // This handler initializes the document when the Editor first becomes
        // ready and each time it is realoaded by the HMR.
        if (event.type === "ready") {
          editor.openDocument(fileName);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // Handle Vite HMR updates: HMR unloads the Editor component which triggers
  // its clean-up logic. The clean-up logic consists of shutting down
  // existing LSP connections. If the connections are not reestablished, then no
  // further communication with the LSP server will be performed. The HMR
  // handlers harmlessly exploit `openDocument` (in the "ready" event handler,
  // above) to restablish these connections. The clean-up logic will be
  // triggered regardless whether the LSP connections are manually cleaned-up,
  // but if they are not manually cleaned-up prior to the HMR then a race
  // condition occurs during the "ready" event handler when it calls
  // `openDocument` while the clean-up logic for the unload event is being
  // performed.
  useEffect(() => {
    if (import.meta.hot) {
      const hmr = import.meta.hot;
      const handleBeforeUpdate = () => editorRef.current?.shutdownLsp();
      hmr.on("vite:beforeUpdate", handleBeforeUpdate);
      return () => {
        hmr.off("vite:beforeUpdate", handleBeforeUpdate);
      };
    }
  }, []);

  useEffect(() => {
    editorRef.current?.openDocument(fileName, (agent ? agent.code : data.code) ?? "");
  }, [agent, data.code]);

  const getCode = useCallback(() => {
    return editorRef.current?.getText(fileName);
  }, []);

  return (
    <CodeLayout getCode={getCode}>
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
