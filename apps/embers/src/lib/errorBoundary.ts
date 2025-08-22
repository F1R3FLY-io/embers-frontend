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

  // eslint-disable-next-line class-methods-use-this
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Error caught in boundary:", error, errorInfo);
  }
  // eslint-disable-next-line
  public render() {
    if (this.state.hasError) {
      return `${this.state.error}`;
    }
    return this.props.children;
  }
}
