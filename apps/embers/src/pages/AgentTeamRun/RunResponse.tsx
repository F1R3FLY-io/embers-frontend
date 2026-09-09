import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/lib/components/Button";

import styles from "./AgentTeamRun.module.scss";

export function RunResponse({
  revealed,
  value,
}: {
  revealed: boolean;
  value: unknown;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    if (revealed) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "nearest" });
    }
  }, [revealed]);
  if (!revealed) {
    return null;
  }
  const raw = value === undefined ? "null" : JSON.stringify(value, null, 2);
  const object =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  const answer =
    typeof value === "string"
      ? value
      : typeof object?.answer === "string"
        ? object.answer
        : undefined;
  const supporting =
    object && answer !== undefined
      ? Object.fromEntries(
          Object.entries(object).filter(([key]) => key !== "answer"),
        )
      : undefined;
  const empty =
    value === null ||
    value === undefined ||
    (answer !== undefined && answer.trim() === "");
  return (
    <section aria-label="Full response" className={styles.response}>
      <h3 ref={heading} tabIndex={-1}>
        Full response (visible only to you)
      </h3>
      <div className={styles.actions}>
        <Button
          type="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                typeof value === "string" ? value : raw,
              );
              setCopyStatus("Response copied");
            } catch {
              setCopyStatus(
                "Could not copy. Select the response text to copy it manually.",
              );
            }
          }}
        >
          Copy response
        </Button>
        <span role="status">{copyStatus}</span>
      </div>
      {empty ? (
        <p>No response text was returned.</p>
      ) : answer !== undefined ? (
        <div className={styles.prose} data-testid="formatted-response">
          <Markdown
            skipHtml
            components={{
              a: ({ children, href }) => (
                <a href={href} rel="noopener noreferrer" target="_blank">
                  {children}
                </a>
              ),
              img: ({ alt, src }) => (
                <a href={src} rel="noopener noreferrer" target="_blank">
                  {alt || "View image"}
                </a>
              ),
              table: ({ children }) => (
                <div
                  aria-label="Response table"
                  className={styles["table-scroll"]}
                  role="region"
                  tabIndex={0}
                >
                  <table>{children}</table>
                </div>
              ),
            }}
            remarkPlugins={[remarkGfm]}
          >
            {answer}
          </Markdown>
        </div>
      ) : (
        <pre className={styles.raw}>{raw}</pre>
      )}
      {supporting && Object.keys(supporting).length > 0 ? (
        <details>
          <summary>Supporting data</summary>
          <pre className={styles.raw}>
            {JSON.stringify(supporting, null, 2)}
          </pre>
        </details>
      ) : null}
      <details>
        <summary>Raw response</summary>
        <pre className={styles.raw} data-testid="reveal-result-json">
          {raw}
        </pre>
      </details>
    </section>
  );
}
