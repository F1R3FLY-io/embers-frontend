/**
 * @jest-environment jsdom
 */
import type React from "react";

import { render, screen } from "@testing-library/react";

// The blank-page regression this suite pins: EditAgent drives the editor from
// its own effects, ABOVE the ErrorBoundary that wraps only the Editor child --
// a boundary never catches its parent. The editor keeps document and LSP
// state in module scope and replays its `ready` event synchronously to new
// subscribers, so revisiting the route (create, deploy, then View Agent)
// runs `openDocument` against a warm, previously-torn-down editor inside a
// React effect; before the fix, the throw unmounted the entire application
// to a bare gray background. The page must instead stay alive, report the
// failure to the dock, and shut the LSP down on unmount so the next mount
// does not race the teardown.

const shutdownLsp = jest.fn();
const openDocument = jest.fn(() => {
  throw new Error("document store poisoned by teardown");
});
const appendLog = jest.fn();

jest.mock(
  "@f1r3fly-io/lightning-bug",
  () => {
    const react = jest.requireActual<typeof React>("react");
    return {
      Editor: react.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
        react.useImperativeHandle(ref, () => ({
          getEvents: () => ({
            // The real editor exposes a replay subject: a subscriber whose
            // editor is already booted receives `ready` synchronously, inside
            // whatever React effect performed the subscribe.
            subscribe: (handler: (event: { type: string }) => void) => {
              handler({ type: "ready" });
              return { unsubscribe: jest.fn() };
            },
          }),
          getText: () => "",
          openDocument,
          renameDocument: jest.fn(),
          setLogLevel: jest.fn(),
          shutdownLsp,
        }));
        return null;
      }),
    };
  },
  { virtual: true },
);
jest.mock(
  "@f1r3fly-io/lightning-bug/extensions",
  () => ({ RholangExtension: {} }),
  { virtual: true },
);
jest.mock(
  "@f1r3fly-io/lightning-bug/extensions/lang/rholang/tree-sitter/queries",
  () => ({ highlightsQueryUrl: "", indentsQueryUrl: "" }),
  { virtual: true },
);
jest.mock(
  "@f1r3fly-io/lightning-bug/tree-sitter",
  () => ({ treeSitterWasmUrl: "" }),
  { virtual: true },
);
jest.mock(
  "@f1r3fly-io/tree-sitter-rholang-js-with-comments",
  () => ({ wasm: "" }),
  { virtual: true },
);

// Stable singletons: the real router returns a referentially stable location,
// and the provider re-seeds agent state whenever the location identity
// changes -- a fresh object per call would loop the render.
const mockLocation = {
  state: { id: "agent-echo", name: "Echo", version: "0" },
};
jest.mock("react-router-dom", () => ({
  useLocation: () => mockLocation,
  useNavigate: () => jest.fn(),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
// Only rendered from the settings dialog; its import chain reaches @/i18n,
// whose `import.meta` the CommonJS test transform cannot parse.
jest.mock("@/lib/components/AgentGeneralInfoFrom", () => ({
  AgentGeneralInfoFrom: () => null,
}));

jest.mock("@/lib/queries", () => ({
  useAgent: () => ({ data: undefined }),
  useAgentVersions: () => ({ data: { agents: [{ version: "0" }] } }),
  useCreateAgentMutation: () => ({ isPending: false, mutateAsync: jest.fn() }),
  useSaveAgentMutation: () => ({ isPending: false, mutateAsync: jest.fn() }),
}));

const mockDock = {
  appendLog,
  clearLogs: jest.fn(),
  deploys: [],
  logs: [],
  markDeploysRead: jest.fn(),
  markLogsRead: jest.fn(),
  unread: { deploys: 0, logs: 0 },
};
jest.mock("@/lib/providers/dock/useDock", () => ({
  useDock: () => mockDock,
}));
jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader: (fn: unknown) => fn,
}));
jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useConfirm: () => jest.fn(),
}));
jest.mock("@/lib/providers/modal/useFormModal", () => ({
  useFormModal: () => jest.fn(),
}));

import { CurrentAgentProvider } from "@/lib/providers/currentAgent/CurrentAgentProvider";
import EditAgent from "@/pages/EditAgent";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("keeps the page alive and reports to the dock when the editor throws in an effect", () => {
  render(
    <CurrentAgentProvider>
      <EditAgent />
    </CurrentAgentProvider>,
  );

  // The layout survived: title and version list are on screen.
  expect(screen.getByText("Echo")).toBeTruthy();
  expect(screen.getByRole("listbox")).toBeTruthy();

  // The failure was reported where the user can see it, not swallowed.
  expect(openDocument).toHaveBeenCalled();
  expect(appendLog).toHaveBeenCalledWith(
    expect.stringContaining("document store poisoned by teardown"),
    "error",
  );
});

it("shuts the LSP down when the route unmounts, mirroring the HMR path", () => {
  const { unmount } = render(
    <CurrentAgentProvider>
      <EditAgent />
    </CurrentAgentProvider>,
  );

  expect(shutdownLsp).not.toHaveBeenCalled();
  unmount();
  expect(shutdownLsp).toHaveBeenCalledTimes(1);
});
