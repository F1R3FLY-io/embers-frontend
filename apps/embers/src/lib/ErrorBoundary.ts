import React from "react";

type ErrorBoundaryState = { error?: Error; hasError: boolean };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  public constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Error caught in boundary:", error, errorInfo);
  }

  // async components are not supported yet
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  public render() {
    if (this.state.hasError) {
      // A legible themed fallback, not a bare string: the previous
      // `${error}` rendered as near-invisible default text on the dark
      // background, so a real crash looked like a blank gray page. Inline
      // styles read the app's theme tokens so the message is visible in
      // either theme without a stylesheet import.
      return React.createElement(
        "div",
        {
          role: "alert",
          style: {
            color: "var(--text-color-primary)",
            fontFamily: "sans-serif",
            margin: "24px auto",
            maxWidth: "640px",
            padding: "24px",
          },
        },
        React.createElement(
          "h1",
          { style: { color: "var(--text-danger)", fontSize: "18px" } },
          "This page failed to render",
        ),
        React.createElement(
          "p",
          null,
          "The view crashed before it could display. Reload the page; if it " +
            "keeps happening, report the detail below.",
        ),
        React.createElement(
          "pre",
          {
            style: {
              background: "var(--background-neutral-surface-primary)",
              borderRadius: "8px",
              fontSize: "13px",
              overflowX: "auto",
              padding: "12px 14px",
              whiteSpace: "pre-wrap",
            },
          },
          String(this.state.error),
        ),
      );
    }
    return this.props.children;
  }
}
