/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Modal } from "@/lib/components/Modal/Modal";

import { installModalRoot } from "./helpers/modalRoot";

// The dialog primitive every confirmation, form, and result modal is built on.
//
// modalDismissal.test.tsx covers the PROVIDER's promise contract -- that a
// dismissed dialog settles rather than leaking. This covers the component
// underneath it: where it renders, which gestures close it, and what it does
// to the page while it is open. Only the provider-level behavior was tested.

beforeEach(() => {
  installModalRoot();
});

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const onClose = jest.fn();
  const result = render(
    <Modal isOpen ariaLabel="Confirm deletion" onClose={onClose} {...props}>
      <p>body</p>
    </Modal>,
  );
  return { ...result, onClose };
}

describe("rendering", () => {
  it("renders into the portal root rather than in place", () => {
    const { container } = renderModal();

    // Portalling is what lets a dialog escape an overflow-hidden or
    // transformed ancestor; rendering in place would clip it inside whatever
    // opened it.
    expect(container).toBeEmptyDOMElement();
    expect(
      document.getElementById("modal-root")?.querySelector("[role='dialog']"),
    ).not.toBeNull();
  });

  it("renders nothing at all when closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("names itself for assistive technology", () => {
    renderModal();

    // Without a name a screen reader announces an unlabelled dialog, which
    // says nothing about what is being confirmed.
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-label",
      "Confirm deletion",
    );
  });

  it("marks itself modal", () => {
    renderModal();

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });
});

describe("closing", () => {
  it("closes on Escape by default", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape when asked to", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ closeOnEsc: false });

    await user.keyboard("{Escape}");

    // Used where dismissing would leave work half-done, so the user has to
    // make a choice rather than dismiss one by reflex.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when the backdrop is pressed", () => {
    const { onClose } = renderModal();
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement;

    // mousedown rather than click: closing on click would also fire when a
    // drag that STARTED inside the dialog happened to end on the backdrop --
    // releasing a text selection, for instance -- and dismiss the dialog the
    // user was working in.
    fireEvent.mouseDown(backdrop as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open when the press lands inside the dialog", () => {
    const { onClose } = renderModal();

    fireEvent.mouseDown(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores the backdrop when asked to", () => {
    const { onClose } = renderModal({ closeOnBlur: false });
    const backdrop = screen.getByRole("dialog").parentElement;

    fireEvent.mouseDown(backdrop as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("offers no close button unless asked", () => {
    renderModal();

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("closes from the close button when it is shown", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ showCloseButton: true });

    await user.click(screen.getByRole("button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("page state", () => {
  it("stops the page behind it from scrolling", () => {
    renderModal();

    // A page that scrolls behind a dialog moves the content the user is being
    // asked about out from under the question.
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("gives scrolling back when it closes", () => {
    const { rerender } = renderModal();
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal ariaLabel="Confirm deletion" isOpen={false} onClose={jest.fn()}>
        <p>body</p>
      </Modal>,
    );

    // Failing to restore this leaves the whole application unscrollable with
    // no dialog on screen to explain why.
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("gives scrolling back when it unmounts without closing first", () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe("hidden");

    // Navigating away while a dialog is open unmounts it directly, skipping
    // the closed render entirely.
    unmount();

    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
