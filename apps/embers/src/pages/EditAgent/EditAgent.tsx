import type { EditorRef } from "@f1r3fly-io/lightning-bug";

import { Editor } from "@f1r3fly-io/lightning-bug";
import { RholangExtension } from "@f1r3fly-io/lightning-bug/extensions";
import {
  highlightsQueryUrl,
  indentsQueryUrl,
} from "@f1r3fly-io/lightning-bug/extensions/lang/rholang/tree-sitter/queries";
import { treeSitterWasmUrl } from "@f1r3fly-io/lightning-bug/tree-sitter";
import { wasm } from "@f1r3fly-io/tree-sitter-rholang-js-with-comments";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { CodeEditorStepperData } from "@/lib/providers/stepper/flows/CodeEditor";

import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { CodeLayout } from "@/lib/layouts/Code";
import { useLayout } from "@/lib/providers/layout/useLayout";
import { useCodeEditorStepper } from "@/lib/providers/stepper/flows/CodeEditor";
import { useAgent, useAgentVersions } from "@/lib/queries";

import styles from "./EditAgent.module.scss";

const logLevel = "trace";

export default function CodeEditor() {
  const editorRef = useRef<EditorRef>(null);
  const { t } = useTranslation();
  const { setHeaderTitle } = useLayout();
  const { data, updateMany } = useCodeEditorStepper();
  const { agentId, version } = data;
  const { data: agent } = useAgent(agentId, version);
  const { data: agentVersions } = useAgentVersions(agentId);
  const location = useLocation();
  const navigate = useNavigate();

  const agentName = agent?.name ?? data.agentName;
  const currentVersion = useMemo(
    () => agent?.version ?? version,
    [agent?.version, version],
  );
  const fileName = `${agentName}.rho`;
  useEffect(() => setHeaderTitle(agentName), [agentName, setHeaderTitle, t]);

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.setLogLevel(logLevel);
      const events = editor.getEvents();
      const subscription = events.subscribe((event) => {
        // This handler initializes the document when the Editor first becomes
        // ready and each time it is reloaded by the HMR.
        if (event.type === "ready") {
          editor.openDocument(fileName);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [fileName]);

  // Handle Vite HMR updates: HMR unloads the Editor component which triggers
  // its clean-up logic. The clean-up logic consists of shutting down
  // existing LSP connections. If the connections are not reestablished, then no
  // further communication with the LSP server will be performed. The HMR
  // handlers harmlessly exploit `openDocument` (in the "ready" event handler,
  // above) to reestablish these connections. The clean-up logic will be
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
      return () => hmr.off("vite:beforeUpdate", handleBeforeUpdate);
    }
  }, []);

  useEffect(() => {
    editorRef.current?.openDocument(
      fileName,
      (agent ? agent.code : data.code) ?? "",
    );
  }, [agent, data.code, fileName]);

  useEffect(() => {
    const preload = location.state as CodeEditorStepperData;
    updateMany(preload);
    void navigate(location.pathname, { replace: true });
    // disabling because I need to run it only ONCE
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const versions = useMemo(() => {
    return agentVersions?.agents.map((version) => version.version);
  }, [agentVersions]);

  const getCode = useCallback(() => {
    return editorRef.current?.getText(fileName);
  }, [fileName]);

  return (
    <CodeLayout
      currentVersion={currentVersion}
      getCode={getCode}
      versions={versions}
    >
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
