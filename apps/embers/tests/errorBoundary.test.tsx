/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import { ErrorBoundary } from "@/lib/ErrorBoundary";

// The regression this pins: the boundary's fallback used to be a bare
// `${error}` string, which rendered as near-invisible default text on the
// dark theme -- a real crash looked like a blank gray page and the user
// missed the message twice. The fallback must now be a legible, themed,
// alert-role element that surfaces the error detail.

function Boom(): never {
  throw new Error("kaboom: reading 'kind' of null");
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("renders a legible, themed fallback carrying the error detail when a child throws", () => {
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  );

  // Structural legibility: an alert region with a heading and the detail.
  const alert = screen.getByRole("alert");
  expect(alert).toBeTruthy();
  expect(screen.getByText("This page failed to render")).toBeTruthy();
  expect(alert.textContent).toContain("kaboom: reading 'kind' of null");

  // The container carries inline styling (theme tokens), not a bare string.
  expect(alert.getAttribute("style")).toContain("var(--text-color-primary)");
});

it("renders its children untouched when nothing throws", () => {
  render(
    <ErrorBoundary>
      <div data-testid="ok">fine</div>
    </ErrorBoundary>,
  );

  expect(screen.getByTestId("ok")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});
