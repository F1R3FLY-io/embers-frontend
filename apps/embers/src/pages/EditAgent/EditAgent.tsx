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

import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { CodeLayout } from "@/lib/layouts/Code";
import { useCurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";
import { useAgentVersions } from "@/lib/queries";
import { useCallOnce } from "@/lib/useCallOnce";

import styles from "./EditAgent.module.scss";

export default function EditAgent() {
  const editorRef = useRef<EditorRef>(null);

  const { agent, update } = useCurrentAgent();
  const { data: agentVersions } = useAgentVersions(agent.id);

  useCallOnce({
    action: () => update({ version: agentVersions?.agents.at(-1)?.version }),
    data: agentVersions,
    pred: () => !!agentVersions,
  });

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.setLogLevel("trace");
      const subscription = editor.getEvents().subscribe((event) => {
        // This handler initializes the document when the Editor first becomes
        // ready and each time it is reloaded by the HMR.
        if (event.type === "ready") {
          editor.openDocument(`${agent.id}.rho`);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [agent.id]);

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
    editorRef.current?.openDocument(`${agent.id}.rho`, agent.code);
  }, [agent.id, agent.code]);

  const getCode = useCallback(
    () => editorRef.current?.getText(`${agent.id}.rho`),
    [agent.id],
  );

  const versions = useMemo(
    () => agentVersions?.agents.map((version) => version.version),
    [agentVersions],
  );

  return (
    <CodeLayout
      currentVersion={agent.version}
      getCode={getCode}
      title={agent.name}
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
