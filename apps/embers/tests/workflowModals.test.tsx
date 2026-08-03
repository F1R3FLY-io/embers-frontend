/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";

import type { WorkflowEdgeData } from "@/lib/workflow";

import { ExecutionPolicyModal } from "@/lib/components/GraphEditor/ExecutionPolicyModal/ExecutionPolicyModal";
import { JoinModal } from "@/lib/components/GraphEditor/JoinModal/JoinModal";
import { EditModal } from "@/lib/components/GraphEditor/nodes/EditModal/EditModal";
import { TransitionModal } from "@/lib/components/GraphEditor/TransitionModal/TransitionModal";
import { ModalProvider } from "@/lib/providers/modal/ModalProvider";

// The workflow dialogs now compose the shared Select/Input/Button primitives
// instead of raw native selects. These tests drive each dialog the way a user
// does -- open a Select, choose an option, save -- and assert the saved data,
// so the restyle can never silently detach a control from the value it edits.

function Providers({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

beforeEach(() => {
  const modalRoot = document.createElement("div");
  modalRoot.id = "modal-root";
  document.body.replaceChildren(modalRoot);
});

const chooseOption = (currentLabel: string, optionLabel: string) => {
  fireEvent.click(screen.getByText(currentLabel));
  fireEvent.mouseDown(screen.getByText(optionLabel));
};

describe("TransitionModal", () => {
  it("saves a Select-driven routing change", () => {
    const onSave = jest.fn<undefined, [WorkflowEdgeData, string]>();
    render(
      <Providers>
        <TransitionModal initial={{}} onSave={onSave} />
      </Providers>,
    );

    chooseOption("All matching routes", "First matching route");
    fireEvent.click(screen.getByText("Save"));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [data, label] = onSave.mock.calls[0];
    expect(data.routeMode).toBe("firstMatch");
    expect(data.trigger).toBe("completed");
    expect(label).toContain("completed");
  });

  it("saves a bounded cycle chosen through the cycle-progress Select", () => {
    const onSave = jest.fn<undefined, [WorkflowEdgeData, string]>();
    render(
      <Providers>
        <TransitionModal initial={{}} onSave={onSave} />
      </Providers>,
    );

    chooseOption("Not a cycle edge", "Bounded iterations");
    fireEvent.click(screen.getByText("Save"));

    const [data] = onSave.mock.calls[0];
    expect(data.loop).toEqual({ maxIterations: 10 });
  });
});

describe("JoinModal", () => {
  it("reveals the quorum input for the quorum policy and saves it", () => {
    const onSave = jest.fn<undefined, [Record<string, unknown>]>();
    render(
      <Providers>
        <JoinModal incomingCount={3} initial={{}} onSave={onSave} />
      </Providers>,
    );

    expect(screen.queryByText("Quorum")).toBeNull();
    chooseOption("Wait for every source", "Run at quorum");
    expect(screen.getByText("Quorum")).toBeTruthy();

    fireEvent.click(screen.getByText("Save"));
    const [data] = onSave.mock.calls[0];
    expect(data.joinMode).toBe("quorum");
    expect(data.quorum).toBe(2);
  });
});

describe("ExecutionPolicyModal", () => {
  it("saves a jitter change made through the Select", () => {
    const onSave = jest.fn<undefined, [Record<string, unknown>]>();
    render(
      <Providers>
        <ExecutionPolicyModal initial={{}} onSave={onSave} />
      </Providers>,
    );

    chooseOption("Enabled", "Disabled");
    fireEvent.click(screen.getByText("Save"));

    const [data] = onSave.mock.calls[0];
    expect(data.deterministicJitter).toBe("false");
  });
});

describe("EditModal", () => {
  it("renders enumerated fields as Selects and free fields as Inputs", () => {
    const onSave = jest.fn<undefined, [Record<string, number | string>]>();
    render(
      <Providers>
        <EditModal
          initial={{ history: "none", label: "Review", scopeKind: "compound" }}
          inputs={[
            { name: "label", type: "string" },
            {
              name: "scopeKind",
              options: [
                { label: "Compound (one initial region)", value: "compound" },
                {
                  label: "Parallel (several initial regions)",
                  value: "parallel",
                },
              ],
              type: "string",
            },
            {
              name: "history",
              options: [
                { label: "No history", value: "none" },
                { label: "Shallow history", value: "shallow" },
                { label: "Deep history", value: "deep" },
              ],
              type: "string",
            },
          ]}
          title="Edit state scope"
          onSave={onSave}
        />
      </Providers>,
    );

    expect(screen.getByDisplayValue("Review")).toBeTruthy();
    chooseOption(
      "Compound (one initial region)",
      "Parallel (several initial regions)",
    );
    chooseOption("No history", "Deep history");
    fireEvent.click(screen.getByText("Save"));

    const [values] = onSave.mock.calls[0];
    expect(values.scopeKind).toBe("parallel");
    expect(values.history).toBe("deep");
    expect(values.label).toBe("Review");
  });
});
