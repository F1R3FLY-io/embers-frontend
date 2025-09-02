import type { EditorRef } from "@f1r3fly-io/lightning-bug";

import { Editor } from "@f1r3fly-io/lightning-bug";
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
          `contract @"fibo"(return, @x) = {
    if (x < 2) {
        return!(x)
    } else {
        new r1, r2 in {
            @"fibo"!(*r1, x - 1) |
            @"fibo"!(*r2, x - 2) |
            for (@x1 <- r1 & @x2 <- r2) {
                return!(x1 + x2)
            }
        }
    }
} |
new return, stdout(\`rho:io:stdout\`) in {
    @"fibo"!(*return, 8) |
    for (@fib8 <- return) {
        stdout!(["fibonacci(8)", fib8])
    }
}`,
          "rholang",
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [setHeaderTitle, editorRef]);

  return (
    <DefaultLayout>
      {/* to make a custom error layout later on */}
      <ErrorBoundary>
        <div className={styles.container}>
          <Editor ref={editorRef} languages={{ rholang: RholangExtension }} />
        </div>
      </ErrorBoundary>
    </DefaultLayout>
  );
}
