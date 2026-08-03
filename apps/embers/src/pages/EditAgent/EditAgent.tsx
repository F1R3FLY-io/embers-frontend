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
import { useDock } from "@/lib/providers/dock/useDock";
import { useAgentVersions } from "@/lib/queries";
import { onViteBeforeUpdate } from "@/lib/viteHmr";

import { agentDocumentName, agentSkeleton } from "./agentSkeleton";
import styles from "./EditAgent.module.scss";

export default function EditAgent() {
  const editorRef = useRef<EditorRef>(null);

  const { agent } = useCurrentAgent();
  const { data: agentVersions } = useAgentVersions(agent.id);
  const dock = useDock();

  // Every editor call below runs in this component's own effects -- ABOVE the
  // ErrorBoundary in the JSX, which only guards the Editor subtree and can
  // never catch its parent. An uncaught throw here (the editor keeps document
  // and LSP state in module scope, so a revisit of this route talks to a
  // warm, previously-torn-down editor) unmounts the entire application to a
  // blank page. Editor failures are page-level incidents, not app-level ones:
  // report them where the user can see them and keep the layout alive.
  const reportEditorFailure = useCallback(
    (stage: string, error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error(`Editor ${stage} failed:`, error);
      dock.appendLog(`Editor ${stage} failed: ${message}`, "error");
    },
    [dock],
  );

  // Name the document after the agent rather than its id: the id does not exist
  // until the first save, so an id-based name would read `undefined.rho` for
  // every new agent and then change out from under the user once saved.
  const documentName = useMemo(
    () => agentDocumentName(agent.name),
    [agent.name],
  );
  const previousDocumentName = useRef(documentName);

  // What the document should contain. A never-saved agent has no id, and that is
  // the only safe signal that this is a new agent: an existing agent's code is
  // briefly undefined while it loads, and seeding the skeleton then would
  // overwrite it.
  //
  // For an existing agent, fall back to empty rather than leaving the document
  // untouched — the editor keeps documents across route changes, so reopening an
  // agent edited earlier in this session would otherwise show that stale text.
  const seed =
    agent.id === undefined ? agentSkeleton(agent.name) : (agent.code ?? "");
  // The "ready" handler fires outside React's data flow, so it reads the seed
  // through a ref rather than closing over a stale value.
  const seedRef = useRef(seed);
  useEffect(() => {
    seedRef.current = seed;
  }, [seed]);

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      try {
        editor.setLogLevel("trace");
        const subscription = editor.getEvents().subscribe((event) => {
          // This handler initializes the document when the Editor first
          // becomes ready and each time it is reloaded by the HMR. It must
          // supply the content as well: the editor assigns its ref only once
          // it is ready, so this can be the first — and, when the agent is
          // already loaded, the only — chance to put the right source in the
          // document. The events stream is a replay subject, so this handler
          // can run synchronously inside this effect.
          if (event.type === "ready") {
            try {
              editor.openDocument(documentName, seedRef.current);
            } catch (error) {
              reportEditorFailure("document initialization", error);
            }
          }
        });
        return () => subscription.unsubscribe();
      } catch (error) {
        reportEditorFailure("event subscription", error);
      }
    }
  }, [documentName, reportEditorFailure]);

  // Renaming the agent renames its document in place; reopening under the new
  // name would discard whatever the author had typed but not yet saved.
  useEffect(() => {
    const previous = previousDocumentName.current;
    if (previous !== documentName) {
      try {
        editorRef.current?.renameDocument(documentName, previous);
      } catch (error) {
        reportEditorFailure("document rename", error);
      }
      previousDocumentName.current = documentName;
    }
  }, [documentName, reportEditorFailure]);

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
    const handleBeforeUpdate = () => editorRef.current?.shutdownLsp();
    return onViteBeforeUpdate(handleBeforeUpdate);
  }, []);

  useEffect(() => {
    try {
      editorRef.current?.openDocument(documentName, seed);
    } catch (error) {
      reportEditorFailure("document open", error);
    }
  }, [documentName, seed, reportEditorFailure]);

  // Route unmount mirrors the HMR path above: the editor's own clean-up tears
  // down its LSP connections, and an un-shut-down connection makes the next
  // mount's openDocument race that teardown — the exact hazard the HMR
  // handler exists for. Without this, revisiting the page (create, deploy,
  // then View Agent) talks to a poisoned editor. The instance is captured at
  // setup because React detaches the child's imperative handle before this
  // cleanup runs, so the ref itself is already null here.
  useEffect(() => {
    const editor = editorRef.current;
    return () => {
      try {
        editor?.shutdownLsp();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Editor LSP shutdown on unmount failed:", error);
      }
    };
  }, []);

  // Read the active document rather than one keyed by name, so a rename can
  // never desync the two and silently save empty code.
  const getCode = useCallback(() => editorRef.current?.getText(), []);

  const versions = useMemo(
    () => agentVersions?.agents.map((version) => version.version) ?? [],
    [agentVersions],
  );

  return (
    <CodeLayout
      currentVersion={agent.version}
      getCode={getCode}
      title={agent.name ?? ""}
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
