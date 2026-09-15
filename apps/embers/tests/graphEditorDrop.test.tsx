/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";

// Adding an agent to a team by dragging it from the sidebar.
//
// This is the path behind "I can create agents but I cannot add them to a
// team": every step between the sidebar's drag payload and a node on the
// canvas is untyped string plumbing through the DataTransfer object, so a
// mismatch anywhere produces a drop that silently does nothing. Nothing tested
// it.
//
// React Flow is stubbed down to the props the drop handler needs, so the
// assertions are about the handler's decisions rather than about canvas
// rendering.

const nodeChanges: unknown[] = [];
const openedModals: { content: unknown; title: string }[] = [];

// Only the canvas itself is replaced. Everything else -- Position, Handle, the
// change helpers -- stays real, because the node registry and the editor's own
// code depend on it, and substituting it would be testing the substitute.
jest.mock("@xyflow/react", () => ({
  ...jest.requireActual<Record<string, unknown>>("@xyflow/react"),
  ReactFlow: ({
    children,
    onDrop,
  }: {
    children?: React.ReactNode;
    onDrop: (event: React.DragEvent) => void;
  }) => (
    <div data-testid="canvas" onDrop={onDrop}>
      {children}
    </div>
  ),
  useReactFlow: () => ({
    screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
  }),
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({
    close: jest.fn(),
    open: (content: unknown, options?: { ariaLabel?: string }) => {
      // The element is kept, not just its label, so a test can drive the
      // dialog's own onSave and follow the drop through to a created node.
      openedModals.push({ content, title: options?.ariaLabel ?? "" });
    },
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { GraphEditor } from "@/lib/components/GraphEditor/GraphEditor";

/** A DataTransfer that only has to remember what was put in it. */
function dataTransfer(entries: Record<string, string>) {
  return {
    dropEffect: "move",
    effectAllowed: "move",
    files: [],
    getData: (key: string) => entries[key] ?? "",
    items: [],
    setData: () => undefined,
    types: Object.keys(entries),
  } as unknown as DataTransfer;
}

/** The payload the sidebar's own drag handler builds, so the shapes agree. */
function sidebarPayload(type: string, data: Record<string, string> = {}) {
  return dataTransfer({
    "application/reactflow": type,
    "application/reactflow-data": JSON.stringify(data),
    "application/reactflow-offset": JSON.stringify({ x: 5, y: 7 }),
  });
}

function renderEditor() {
  nodeChanges.length = 0;
  openedModals.length = 0;
  render(
    // The real provider, because the editor's own children still use React
    // Flow hooks that read its store; only the canvas component is replaced.
    <ReactFlowProvider>
      <GraphEditor
        edges={[]}
        nodes={[]}
        setEdges={() => undefined}
        // The editor adds a node by asking its owner to update state; recording
        // the updater is how "a node was added" becomes observable without a
        // rendered canvas.
        setNodes={(change) => {
          nodeChanges.push(change([]));
        }}
        onGraphChange={() => undefined}
      />
    </ReactFlowProvider>,
  );
  return screen.getByTestId("canvas");
}

function drop(canvas: HTMLElement, transfer: DataTransfer) {
  fireEvent.drop(canvas, {
    clientX: 100,
    clientY: 120,
    dataTransfer: transfer,
  });
}

it("drops an agent immediately with the default protocol and its identity", () => {
  const canvas = renderEditor();
  drop(
    canvas,
    sidebarPayload("agent", {
      agentId: "agent-1",
      agentName: "Researcher",
      agentVersion: "v1",
    }),
  );
  expect(openedModals).toHaveLength(0);
  expect(nodeChanges).toHaveLength(1);
  expect(nodeChanges[0]).toMatchObject([
    {
      data: {
        agentId: "agent-1",
        agentName: "Researcher",
        agentVersion: "v1",
        protocol: "simple-v1",
      },
      type: "agent",
    },
  ]);
});

it("refuses an agent drop that carries no identity", () => {
  const canvas = renderEditor();

  // An agent node with no id compiles to a graph the backend cannot resolve,
  // and the failure would not appear until deploy. Refusing the drop is the
  // deliberate behavior; this pins it so nobody "fixes" the silent no-op by
  // creating the broken node instead.
  drop(canvas, sidebarPayload("agent", { agentName: "Researcher" }));

  expect(nodeChanges).toHaveLength(0);
});

it("refuses a drop for a node kind that does not exist", () => {
  const canvas = renderEditor();

  drop(canvas, sidebarPayload("not-a-registered-kind"));

  expect(nodeChanges).toHaveLength(0);
});

it("ignores a drop that carries nothing at all", () => {
  const canvas = renderEditor();

  // A drag from outside the app -- a file, a selection -- lands here too.
  drop(canvas, dataTransfer({}));

  expect(nodeChanges).toHaveLength(0);
});

it("still accepts the drop when the drag offset is unreadable", () => {
  const canvas = renderEditor();

  drop(
    canvas,
    dataTransfer({
      "application/reactflow": "agent",
      "application/reactflow-data": JSON.stringify({ agentId: "agent-1" }),
      "application/reactflow-offset": "{not json",
    }),
  );

  // A malformed offset costs a few pixels of placement accuracy; refusing the
  // drop over it would cost the user their action.
  expect(openedModals).toHaveLength(0);
  expect(nodeChanges).toHaveLength(1);
});

it("refuses the agent drop when its data is unreadable, rather than guessing", () => {
  const canvas = renderEditor();

  drop(
    canvas,
    dataTransfer({
      "application/reactflow": "agent",
      "application/reactflow-data": "{not json",
      "application/reactflow-offset": JSON.stringify({ x: 0, y: 0 }),
    }),
  );

  // Unreadable data means no agent id, and the identity requirement holds
  // however the id went missing.
  expect(nodeChanges).toHaveLength(0);
});

it("asks for configuration instead of dropping straight in, for kinds that need it", () => {
  const canvas = renderEditor();

  drop(canvas, sidebarPayload("wait"));

  // A node with required inputs is configured before it exists, so the canvas
  // never holds a half-specified one.
  expect(nodeChanges).toHaveLength(0);
  expect(openedModals).toHaveLength(1);
});

it("creates a node immediately for a kind that needs no configuration", () => {
  const canvas = renderEditor();

  drop(canvas, sidebarPayload("output-node"));

  // The complement: a kind with no modal inputs must not stop to ask, or every
  // drop would cost the user an extra dialog.
  expect(openedModals).toHaveLength(0);
  expect(nodeChanges).toHaveLength(1);
});
