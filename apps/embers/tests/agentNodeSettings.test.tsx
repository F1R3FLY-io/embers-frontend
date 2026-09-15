/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactFlowProvider } from "@xyflow/react";
import { useState } from "react";

import type { Node } from "@/lib/components/GraphEditor/nodes";

import { GraphEditor } from "@/lib/components/GraphEditor/GraphEditor";
import { ModalProvider } from "@/lib/providers/modal/ModalProvider";

let mockNodes: Node[] = [];
const mockCanvasClick = jest.fn();
const mockGraphChange = jest.fn();

jest.mock("@/lib/queries", () => ({
  useAgents: () => ({ data: { agents: [{ id: "agent-1", version: "v1" }] } }),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@xyflow/react", () => ({
  ...jest.requireActual<Record<string, unknown>>("@xyflow/react"),
  Handle: () => null,
  ReactFlow: ({
    children,
    nodes,
    nodeTypes,
  }: {
    children: React.ReactNode;
    nodes: Node[];
    nodeTypes: Record<string, React.ComponentType<Node>>;
  }) => {
    mockNodes = nodes;
    return (
      <div onClick={mockCanvasClick}>
        {nodes.map((node) => {
          const Component = nodeTypes[node.type];
          return <Component key={node.id} {...node} />;
        })}
        {children}
      </div>
    );
  },
  useReactFlow: () => ({
    getNode: (id: string) => mockNodes.find((node) => node.id === id),
  }),
}));

const initialNode: Node = {
  data: {
    agentId: "agent-1",
    agentName: "Researcher",
    agentVersion: "v1",
    outputKey: "research",
    protocol: "simple-v1",
  },
  id: "node-1",
  parentId: "deployment-1",
  position: { x: 100, y: 200 },
  type: "agent",
};

function Editor() {
  const [nodes, setNodes] = useState([initialNode]);
  return (
    <ModalProvider>
      <ReactFlowProvider>
        <GraphEditor
          edges={[]}
          nodes={nodes}
          setEdges={() => undefined}
          setNodes={setNodes}
          onGraphChange={mockGraphChange}
        />
      </ReactFlowProvider>
    </ModalProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  const modalRoot = document.createElement("div");
  modalRoot.id = "modal-root";
  document.body.appendChild(modalRoot);
});

afterEach(() => document.getElementById("modal-root")?.remove());

it("opens settings from the gear and saves the enumerated protocol on the same nested node", async () => {
  render(<Editor />);
  const gear = screen.getByRole("button", { name: "Configure Researcher" });
  expect(gear.classList.contains("nodrag")).toBe(true);
  expect(gear.classList.contains("nopan")).toBe(true);
  fireEvent.click(gear);
  expect(mockCanvasClick).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog", { name: "Edit node" })).toBeVisible();
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Protocol" }), {
    key: "ArrowDown",
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(mockNodes).toEqual([
    {
      ...initialNode,
      data: { ...initialNode.data, protocol: "structured-v1" },
    },
  ]);
  expect(mockGraphChange).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Configure Researcher" }));
  expect(
    screen.getByRole("combobox", { name: "Protocol" }).textContent,
  ).toContain("structured-v1");
});

it("supports keyboard activation and leaves the node unchanged when cancelled", async () => {
  const user = userEvent.setup();
  render(<Editor />);
  screen.getByRole("button", { name: "Configure Researcher" }).focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("dialog", { name: "Edit node" })).toBeVisible();
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Protocol" }), {
    key: "ArrowDown",
  });
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(mockNodes).toEqual([initialNode]);
  expect(mockGraphChange).not.toHaveBeenCalled();
});
