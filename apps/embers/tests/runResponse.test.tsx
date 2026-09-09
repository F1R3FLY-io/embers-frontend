/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RunResponse } from "@/pages/AgentTeamRun/RunResponse";

const mockWriteText = jest.fn();

beforeEach(() => {
  mockWriteText.mockReset().mockResolvedValue(undefined);
  HTMLElement.prototype.scrollIntoView = jest.fn();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: mockWriteText },
  });
});

it("formats Markdown and copies the original response", async () => {
  const value =
    "# Recommendation\n\nKeep **review** mandatory.\n\n- Allow emergency fixes\n- Review afterward";
  render(<RunResponse revealed value={value} />);
  expect(screen.getByRole("heading", { name: "Recommendation" })).toBeVisible();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(
    screen.getByRole("heading", {
      name: "Full response (visible only to you)",
    }),
  ).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Copy response" }));
  await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith(value));
  expect(await screen.findByText("Response copied")).toBeVisible();
});

it("preserves supporting data alongside a structured answer", () => {
  const value = {
    answer: "## Decision\n\nProceed with the pilot.",
    approved: false,
    evidence: [1, 2],
  };
  render(<RunResponse revealed value={value} />);
  expect(screen.getByRole("heading", { name: "Decision" })).toBeVisible();
  fireEvent.click(screen.getByText("Supporting data"));
  expect(
    screen.getByText("Supporting data").closest("details"),
  ).toHaveTextContent('"approved": false');
  fireEvent.click(screen.getByText("Raw response"));
  expect(screen.getByTestId("reveal-result-json").textContent).toBe(
    JSON.stringify(value, null, 2),
  );
});

it.each([null, "", "  ", undefined, { answer: "  " }])(
  "shows an empty state for %p",
  (value) => {
    render(<RunResponse revealed value={value} />);
    expect(screen.getByText("No response text was returned.")).toBeVisible();
  },
);

it("does not render content until revealed and removes it when hidden", () => {
  const view = render(<RunResponse revealed={false} value="Private answer" />);
  expect(screen.queryByText("Private answer")).toBeNull();
  view.rerender(<RunResponse revealed value="Private answer" />);
  expect(screen.getByText("Private answer")).toBeVisible();
  view.rerender(<RunResponse revealed={false} value="Private answer" />);
  expect(screen.queryByText("Private answer")).toBeNull();
});

it("handles clipboard failure without losing the answer", async () => {
  mockWriteText.mockRejectedValueOnce(new Error("denied"));
  render(<RunResponse revealed value="Keep this answer visible." />);
  fireEvent.click(screen.getByRole("button", { name: "Copy response" }));
  expect(await screen.findByText(/Could not copy/)).toBeVisible();
  expect(screen.getByText("Keep this answer visible.")).toBeVisible();
});

it("does not execute HTML or fetch images from response text", () => {
  render(
    <RunResponse
      revealed
      value={
        "<script>alert(1)</script>\n\n![Diagram](https://example.com/image.png)\n\n[Unsafe](javascript:alert(1))"
      }
    />,
  );
  expect(document.querySelector("script")).toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByRole("link", { name: "Diagram" })).toHaveAttribute(
    "href",
    "https://example.com/image.png",
  );
  expect(screen.getByText("Unsafe")).not.toHaveAttribute(
    "href",
    // eslint-disable-next-line no-script-url -- Adversarial Markdown fixture.
    "javascript:alert(1)",
  );
});
