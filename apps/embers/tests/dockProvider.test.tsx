/**
 * @jest-environment jsdom
 */

import type { PropsWithChildren } from "react";

import { act, renderHook } from "@testing-library/react";

import { DockProvider } from "@/lib/providers/dock/DockProvider";
import { useDock } from "@/lib/providers/dock/useDock";

// The dock: the only place a deploy failure or a run link is ever reported
// inside the editors.
//
// It had no tests. Three of its behaviors are load-bearing and none of them is
// obvious from the outside: the entry cap (an editor session can log
// indefinitely, and an unbounded array is a leak the user cannot see), the
// unread markers (the only signal that something was reported while the panel
// was closed), and the persisted open state (which must survive a corrupted
// value rather than throwing on mount).

function wrapper(maxEntries?: number) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <DockProvider maxEntries={maxEntries}>{children}</DockProvider>;
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("logs", () => {
  it("puts the newest entry first", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.appendLog("first");
      result.current.appendLog("second");
    });

    // Newest-first, so the panel shows what just happened without scrolling.
    // Pinned because it decides which end the entry cap discards from.
    expect(result.current.logs.map((entry) => entry.text)).toEqual([
      "second",
      "first",
    ]);
  });

  it("keeps the newest entries when the cap is reached", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper(3) });

    act(() => {
      for (const text of ["a", "b", "c", "d", "e"]) {
        result.current.appendLog(text);
      }
    });

    // A long editor session logs indefinitely, so the list must be bounded.
    // WHICH END is discarded is the whole question: entries are prepended, and
    // the cap used to slice from the end, keeping the OLDEST. Once the dock
    // filled it discarded every new entry and went on showing a stale list --
    // silently ceasing to report at exactly the point there was most to
    // report. These assert the newest survive.
    expect(result.current.logs).toHaveLength(3);
    expect(result.current.logs.map((entry) => entry.text)).toEqual([
      "e",
      "d",
      "c",
    ]);
  });

  it("keeps reporting after the cap is reached", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper(2) });

    act(() => {
      result.current.appendLog("old");
      result.current.appendLog("older still");
      result.current.appendLog("the one that matters");
    });

    // The consequence stated directly: a full dock must still show what just
    // happened. This is what fails when the cap discards from the wrong end.
    expect(result.current.logs[0].text).toBe("the one that matters");
  });

  it("carries a link when one is given", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.appendLog("run started", "info", {
        href: "/runs/run-1",
        label: "Open run inspector",
      });
    });

    // The run link is how a user reaches a run they just started; losing it
    // strands them with an id and no way to use it.
    expect(result.current.logs[0].link).toEqual({
      href: "/runs/run-1",
      label: "Open run inspector",
    });
  });

  it("clears on request", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.appendLog("noise");
      result.current.clearLogs();
    });

    expect(result.current.logs).toEqual([]);
  });
});

describe("unread markers", () => {
  it("marks logs unread when one arrives while the panel is closed", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.appendLog("something happened");
    });

    expect(result.current.unread.logs).toBe(true);
  });

  it("clears the marker when the panel is read", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.appendLog("something happened");
      result.current.markLogsRead();
    });

    expect(result.current.unread.logs).toBe(false);
  });

  it("keeps the deploy and log markers independent", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.appendDeploy(false);
    });

    // Reading one panel must not silence the other, or a failed deploy could
    // be dismissed by glancing at the logs.
    expect(result.current.unread.deploy).toBe(true);
    expect(result.current.unread.logs).toBe(false);
  });

  it("records whether a deploy succeeded", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.appendDeploy(true);
      result.current.appendDeploy(false);
    });

    // Newest first, as with logs.
    expect(result.current.deploys.map((entry) => entry.success)).toEqual([
      false,
      true,
    ]);
  });
});

describe("panel state", () => {
  it("remembers which panels were open", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.setOpened("logs", true);
    });

    expect(
      JSON.parse(localStorage.getItem("dockOpened") ?? "{}"),
    ).toMatchObject({ logs: true });
  });

  it("restores them on the next mount", () => {
    localStorage.setItem(
      "dockOpened",
      JSON.stringify({ deploy: true, logs: false }),
    );

    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    expect(result.current.opened.deploy).toBe(true);
    expect(result.current.opened.logs).toBe(false);
  });

  it("starts closed when the stored value is unreadable", () => {
    // A corrupted value must not throw during a provider's initial state:
    // that would take down the whole editor at mount, over a panel.
    localStorage.setItem("dockOpened", "{not json");

    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    expect(result.current.opened).toEqual({ deploy: false, logs: false });
  });

  it("ignores a stored value of the wrong shape", () => {
    localStorage.setItem("dockOpened", JSON.stringify({ logs: "yes" }));

    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    // Coerced rather than trusted: a string would otherwise flow into a
    // boolean-typed field and render as an always-open panel.
    expect(typeof result.current.opened.logs).toBe("boolean");
  });

  it("toggles a panel", () => {
    const { result } = renderHook(() => useDock(), { wrapper: wrapper() });

    act(() => {
      result.current.toggleOpened("deploy");
    });
    expect(result.current.opened.deploy).toBe(true);

    act(() => {
      result.current.toggleOpened("deploy");
    });
    expect(result.current.opened.deploy).toBe(false);
  });
});
