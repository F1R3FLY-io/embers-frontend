/**
 * @jest-environment jsdom
 */
import type { EdgeProps } from "@xyflow/react";

import { render, screen } from "@testing-library/react";

import type { WorkflowEdgeData } from "@/lib/workflow";

import { WorkflowEdge } from "@/lib/components/GraphEditor/WorkflowEdge/WorkflowEdge";

// The custom edge renders the path plus, only when the transition deviates
// from the defaults, a background-free annotation. The React Flow internals
// are stubbed so the test drives exactly what WorkflowEdge itself decides:
// whether an annotation exists, what it says, and that no legacy label
// machinery (the .react-flow__edge-textbg white box) is ever produced.

jest.mock("@xyflow/react", () => ({
  BaseEdge: ({ path }: { path: string }) => (
    <path d={path} data-testid="base-edge" />
  ),
  EdgeLabelRenderer: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode => children,
  getBezierPath: () => ["M 0 0 C 50 0 50 100 100 100", 50, 50, 0, 0],
}));

function edgeProps(data: WorkflowEdgeData, label?: string): EdgeProps {
  return {
    data,
    id: "t1",
    label,
    source: "a",
    sourcePosition: "bottom",
    sourceX: 0,
    sourceY: 0,
    target: "b",
    targetPosition: "top",
    targetX: 100,
    targetY: 100,
  } as unknown as EdgeProps;
}

it("renders a fully default edge as a bare path with no annotation", () => {
  const { container } = render(
    <svg>
      <WorkflowEdge
        {...edgeProps({
          noMatch: "fail",
          priority: 0,
          routeMode: "allMatches",
          transitionId: "t1",
          trigger: "completed",
        })}
      />
    </svg>,
  );

  expect(screen.getByTestId("base-edge")).toBeTruthy();
  expect(screen.queryByRole("note")).toBeNull();
  expect(container.querySelector(".react-flow__edge-textbg")).toBeNull();
});

it("renders a deviant edge as symbols with the stored label as its name", () => {
  const label = "failed: output.score ge 0.8 · ≤3";
  const { container } = render(
    <svg>
      <WorkflowEdge
        {...edgeProps(
          {
            guard: {
              kind: "compare",
              left: { kind: "path", path: ["score"], root: "output" },
              operator: "ge",
              right: { kind: "literal", value: 0.8 },
            },
            loop: { maxIterations: 3 },
            noMatch: "fail",
            priority: 0,
            routeMode: "allMatches",
            transitionId: "t1",
            trigger: "failed",
          },
          label,
        )}
      />
    </svg>,
  );

  const note = screen.getByRole("note");
  expect(note.textContent).toBe("failed · output.score ≥ 0.8 · ↻ ≤ 3");
  expect(note.getAttribute("title")).toBe(label);
  expect(note.getAttribute("aria-label")).toBe(label);
  expect(container.querySelector(".react-flow__edge-textbg")).toBeNull();
});

it("marks a durable cycle with its own symbol", () => {
  render(
    <svg>
      <WorkflowEdge
        {...edgeProps({
          loop: { durableYield: true },
          transitionId: "t1",
          trigger: "completed",
        })}
      />
    </svg>,
  );

  expect(screen.getByRole("note").textContent).toBe("↻ d");
});
