/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const setKey = jest.fn();

jest.mock("@/lib/providers/wallet/useApi", () => ({
  useWalletState: () => ({ ready: true, setKey }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "en" }, t: (key: string) => key }),
}));

// Each tab records which props it was handed, so the shell's job -- routing
// search text and sort order to whichever tab is showing -- is observable
// without rendering three real tabs and their queries.
const rendered: { searchQuery: string; sortBy: string; tab: string }[] = [];
const stubTab = (tab: string) =>
  function StubTab(props: { searchQuery: string; sortBy: string }) {
    rendered.push({ ...props, tab });
    return <div data-testid={`tab-content-${tab}`} />;
  };

jest.mock("@/pages/Dashboard/components/AgentsTab", () => ({
  __esModule: true,
  default: stubTab("agents"),
}));
jest.mock("@/pages/Dashboard/components/AgentTeamsTab", () => ({
  __esModule: true,
  default: stubTab("agent-teams"),
}));
jest.mock("@/pages/Dashboard/components/GraphicalQueryTab", () => ({
  __esModule: true,
  default: stubTab("graphical-query"),
}));

import Dashboard from "@/pages/Dashboard/Dashboard";

// The dashboard shell: which tab is showing, what it remembers, and what it
// hands down.
//
// None of this was covered. The tab choice is persisted to localStorage and
// read back with an unchecked cast, so a stored value that is not a tab id is
// the interesting case -- and it is reachable, because the key survives a
// release that renames or removes a tab.

beforeEach(() => {
  rendered.length = 0;
  localStorage.clear();
  jest.clearAllMocks();
});

it("opens on the agents tab when nothing has been chosen before", () => {
  render(<Dashboard />);

  expect(screen.getByTestId("tab-content-agents")).toBeInTheDocument();
});

it("remembers the tab across a remount", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<Dashboard />);

  await user.click(screen.getByText("agents.agentTeams"));
  expect(screen.getByTestId("tab-content-agent-teams")).toBeInTheDocument();
  expect(localStorage.getItem("dashboard_tab")).toBe("agent-teams");

  unmount();
  render(<Dashboard />);

  // The whole point of persisting it: coming back to the dashboard should not
  // silently move the user somewhere else.
  expect(screen.getByTestId("tab-content-agent-teams")).toBeInTheDocument();
});

it("falls back to the first tab when the stored value is not a tab", () => {
  // Reachable in practice: the key outlives any release that renames or
  // removes a tab, and it is read back with an unchecked cast. Falling back
  // rather than rendering nothing is what keeps a stale value from producing
  // an empty dashboard.
  localStorage.setItem("dashboard_tab", "a-tab-that-no-longer-exists");

  render(<Dashboard />);

  expect(screen.getByTestId("tab-content-agents")).toBeInTheDocument();
});

it("passes the search text to whichever tab is showing", async () => {
  const user = userEvent.setup();
  render(<Dashboard />);

  await user.type(screen.getByRole("textbox"), "refine");

  const latest = rendered.at(-1);
  expect(latest?.tab).toBe("agents");
  expect(latest?.searchQuery).toBe("refine");
});

it("carries the search text across a tab change", async () => {
  const user = userEvent.setup();
  render(<Dashboard />);

  await user.type(screen.getByRole("textbox"), "refine");
  await user.click(screen.getByText("agents.agentTeams"));

  // Switching tabs must not silently discard the query while the box still
  // shows it -- that reads as a tab with no matches.
  const latest = rendered.at(-1);
  expect(latest?.tab).toBe("agent-teams");
  expect(latest?.searchQuery).toBe("refine");
});

it("starts sorted by date", () => {
  render(<Dashboard />);

  expect(rendered.at(-1)?.sortBy).toBe("date");
});

it("signs the wallet out with no key at all", async () => {
  const user = userEvent.setup();
  render(<Dashboard />);

  await user.click(screen.getByText("dashboard.logout"));

  // Called with NO argument: passing a falsy key would still be passing a key,
  // and the provider distinguishes the two.
  expect(setKey).toHaveBeenCalledTimes(1);
  expect(setKey.mock.calls[0]).toHaveLength(0);
});
