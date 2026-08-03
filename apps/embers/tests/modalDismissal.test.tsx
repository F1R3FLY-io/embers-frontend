/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LoaderProvider } from "@/lib/providers/loader/LoaderProvider";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import { useAlert, useConfirm } from "@/lib/providers/modal/useConfirm";

// The overlay deadlock this suite pins: the spinner renders above every modal
// (z-index 100000 versus 1000), so a confirm awaited while the loader is held
// can never be answered -- hide() sits in a finally that never runs, and the
// page is dead until a refresh. Two defenses are under test: the delete flow
// keeps dialogs outside every loader wrap, and a dialog dismissed by ANY path
// settles its promise so even a mistaken confirm-under-loader recovers.

jest.mock("@/lib/components/Spinner", () => ({
  Spinner: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="spinner" /> : null,
}));

const TICK = async () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoaderProvider>
      <ModalProvider>{children}</ModalProvider>
    </LoaderProvider>
  );
}

beforeEach(() => {
  const modalRoot = document.createElement("div");
  modalRoot.id = "modal-root";
  document.body.replaceChildren(modalRoot);
});

describe("the delete-flow shape: dialogs outside, work inside the loader", () => {
  const workRan = jest.fn();

  function DeleteFlowProbe() {
    const confirm = useConfirm();
    const readTeams = useCallbackWithLoader(async () => {
      await TICK();
      return ["team-1"];
    });
    const work = useCallbackWithLoader(async () => {
      workRan();
      await TICK();
    });

    const run = async () => {
      await readTeams();
      if (!(await confirm({ message: "Delete the agent?" }))) {
        return;
      }
      await work();
    };

    return (
      <button data-testid="delete" onClick={() => void run()}>
        delete
      </button>
    );
  }

  beforeEach(() => workRan.mockClear());

  it("shows the confirmation with no spinner above it, then works under the loader", async () => {
    render(
      <Providers>
        <DeleteFlowProbe />
      </Providers>,
    );

    fireEvent.click(screen.getByTestId("delete"));

    // The dialog is reachable: it appears only after the loader-wrapped read
    // released the overlay, so nothing can sit on top of it.
    const confirmButton = await screen.findByText("Confirm");
    expect(screen.queryByTestId("spinner")).toBeNull();

    fireEvent.click(confirmButton);
    await waitFor(() => expect(workRan).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("spinner")).toBeNull());
    expect(screen.queryByText("Confirm")).toBeNull();
  });

  it("cancelling runs no work and clears everything", async () => {
    render(
      <Providers>
        <DeleteFlowProbe />
      </Providers>,
    );

    fireEvent.click(screen.getByTestId("delete"));
    fireEvent.click(await screen.findByText("Cancel"));

    await TICK();
    expect(workRan).not.toHaveBeenCalled();
    expect(screen.queryByTestId("spinner")).toBeNull();
    expect(screen.queryByText("Confirm")).toBeNull();
  });
});

describe("dismissed dialogs settle their promises", () => {
  it("escape resolves a pending confirm as a cancellation", async () => {
    const outcomes: boolean[] = [];

    function Probe() {
      const confirm = useConfirm();
      return (
        <button
          data-testid="ask"
          onClick={() =>
            void confirm({ message: "Sure?" }).then((answer) =>
              outcomes.push(answer),
            )
          }
        >
          ask
        </button>
      );
    }

    render(
      <Providers>
        <Probe />
      </Providers>,
    );

    fireEvent.click(screen.getByTestId("ask"));
    await screen.findByText("Confirm");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(outcomes).toEqual([false]));
    expect(screen.queryByText("Confirm")).toBeNull();
  });

  it("escape acknowledges a pending alert", async () => {
    const acknowledged = jest.fn();

    function Probe() {
      const alert = useAlert();
      return (
        <button
          data-testid="warn"
          onClick={() => void alert({ message: "It broke." }).then(acknowledged)}
        >
          warn
        </button>
      );
    }

    render(
      <Providers>
        <Probe />
      </Providers>,
    );

    fireEvent.click(screen.getByTestId("warn"));
    await screen.findByText("OK");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(acknowledged).toHaveBeenCalledTimes(1));
  });

  it("a button decision earlier makes the dismissal settle a no-op", async () => {
    const outcomes: boolean[] = [];

    function Probe() {
      const confirm = useConfirm();
      return (
        <button
          data-testid="ask"
          onClick={() =>
            void confirm({ message: "Sure?" }).then((answer) =>
              outcomes.push(answer),
            )
          }
        >
          ask
        </button>
      );
    }

    render(
      <Providers>
        <Probe />
      </Providers>,
    );

    fireEvent.click(screen.getByTestId("ask"));
    fireEvent.click(await screen.findByText("Confirm"));

    await waitFor(() => expect(outcomes).toEqual([true]));
    // The close path fires the dismissal settle after the explicit answer;
    // a settled promise ignores it, so the answer stands.
    expect(outcomes).toEqual([true]);
  });
});

describe("the pre-fix mistake is recoverable instead of a page-refresh deadlock", () => {
  it("a confirm awaited under the loader settles on dismissal and releases the overlay", async () => {
    const outcomes: boolean[] = [];

    function BrokenFlowProbe() {
      const confirm = useConfirm();
      // Deliberately the OLD, wrong shape: the dialog awaited inside the
      // loader wrap. The spinner sits above the dialog, so no button can be
      // clicked -- but Escape now settles the promise, the finally runs, and
      // the overlay clears instead of surviving until a refresh.
      const broken = useCallbackWithLoader(async () => {
        outcomes.push(await confirm({ message: "Unreachable buttons" }));
      });
      return (
        <button data-testid="broken" onClick={() => void broken()}>
          broken
        </button>
      );
    }

    render(
      <Providers>
        <BrokenFlowProbe />
      </Providers>,
    );

    fireEvent.click(screen.getByTestId("broken"));
    await screen.findByText("Confirm");
    expect(screen.getByTestId("spinner")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(outcomes).toEqual([false]));
    await waitFor(() => expect(screen.queryByTestId("spinner")).toBeNull());
  });
});
