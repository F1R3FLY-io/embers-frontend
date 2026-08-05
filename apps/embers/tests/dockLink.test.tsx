/**
 * @jest-environment jsdom
 */
import type React from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { Footer } from "@/lib/layouts/Graph/Footer";
import { DockProvider } from "@/lib/providers/dock/DockProvider";
import { useDock } from "@/lib/providers/dock/useDock";

// The dock log panel is the editor's run console. A log entry may carry an
// optional link (the run-inspector deep link appended after every Run) which
// the footer must render as real navigation; entries without a link must stay
// plain text. The router is mocked per repo convention: react-router's dist
// bundle does not load under the jest environment, and the assertion target
// is the anchor the Link resolves to, not router internals.

jest.mock("react-router-dom", () => ({
  Link: ({
    children,
    className,
    to,
  }: {
    children: React.ReactNode;
    className?: string;
    to: string;
  }) => (
    <a className={className} href={to}>
      {children}
    </a>
  ),
}));

function SeedButton() {
  const dock = useDock();
  return (
    <button
      type="button"
      onClick={() => {
        dock.appendLog("plain entry");
        dock.appendLog("Run run-42", "info", {
          href: "/runs/run-42",
          label: "Open run inspector",
        });
      }}
    >
      seed
    </button>
  );
}

function renderFooterWithLogs() {
  render(
    <DockProvider>
      <SeedButton />
      <Footer />
    </DockProvider>,
  );
  fireEvent.click(screen.getByText("seed"));
}

describe("dock log links", () => {
  it("renders a linked log entry as run-inspector navigation", () => {
    renderFooterWithLogs();

    const link = screen.getByRole("link", { name: "Open run inspector" });
    expect(link.getAttribute("href")).toBe("/runs/run-42");
  });

  it("keeps unlinked entries plain", () => {
    renderFooterWithLogs();

    expect(screen.getByText("plain entry")).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
