/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReactModal from "react-modal";

import { Button } from "@/lib/components/Button";
import { Checkbox } from "@/lib/components/Checkbox";
import { Input } from "@/lib/components/Input";
import { SearchControl } from "@/lib/components/SearchControl";
import { Spinner } from "@/lib/components/Spinner";

// The shared primitives every screen is assembled from.
//
// None had tests, and their failure modes are quiet ones: a button that
// submits when it should not, a disabled control that still fires, an input
// that drops a keystroke. Each is small on its own and reaches every page.

beforeAll(() => {
  // react-modal warns unless told which element is the app; the spinner
  // renders into the body, so the body is the honest answer.
  ReactModal.setAppElement(document.body);
});

describe("Button", () => {
  it("is a plain button unless asked to submit", () => {
    render(
      <Button type="primary" onClick={() => undefined}>
        Save
      </Button>,
    );

    // The default matters: a button inside a form defaults to type=submit in
    // HTML, so an unmarked action button would submit the form around it.
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("submits when asked", () => {
    render(
      <Button submit type="primary" onClick={() => undefined}>
        Publish
      </Button>,
    );

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("does not act when disabled", async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(
      <Button disabled type="primary" onClick={onClick}>
        Deploy
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("says it is disabled, not merely looks it", () => {
    render(
      <Button disabled type="primary" onClick={() => undefined}>
        Deploy
      </Button>,
    );

    // aria-disabled as well as the attribute: a styled-only disable is
    // invisible to a screen reader, which then announces an available action.
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("carries a name when it has only an icon", () => {
    render(
      <Button
        ariaLabel="Delete agent"
        icon={<span />}
        type="subtle"
        onClick={() => undefined}
      />,
    );

    // An icon-only button with no label is announced as "button" and nothing
    // else, which is unusable without sight of the icon.
    expect(
      screen.getByRole("button", { name: "Delete agent" }),
    ).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("reports every keystroke", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Input placeholder="Name" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("Name"), "abc");

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("shows the value it is given", () => {
    render(<Input placeholder="Name" value="Researcher" />);

    expect(screen.getByPlaceholderText("Name")).toHaveValue("Researcher");
  });

  it("accepts nothing when disabled", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Input disabled placeholder="Name" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("Name"), "abc");

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Checkbox", () => {
  it("reports the new state, not the old one", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Checkbox checked={false} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox"));

    // Reporting the value at click time rather than the value after it is a
    // classic inversion, and it silently does the opposite of what was asked.
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("reports false when unchecking", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Checkbox checked onChange={onChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe("SearchControl", () => {
  it("reports the text rather than the event", async () => {
    const onSearchChange = jest.fn();
    const user = userEvent.setup();
    render(
      <SearchControl
        placeholder="Search"
        searchQuery=""
        onSearchChange={onSearchChange}
      />,
    );

    await user.type(screen.getByRole("textbox"), "r");

    // The control unwraps the event for its callers, so a dashboard tab
    // receives a query string rather than having to reach into a DOM event.
    expect(onSearchChange).toHaveBeenCalledWith("r");
  });

  it("shows the query it is given", () => {
    render(
      <SearchControl
        placeholder="Search"
        searchQuery="refine"
        onSearchChange={() => undefined}
      />,
    );

    // Controlled: the dashboard owns the query, which is what lets it survive
    // a tab change.
    expect(screen.getByRole("textbox")).toHaveValue("refine");
  });
});

describe("Spinner", () => {
  it("shows nothing until it is open", () => {
    render(<Spinner isOpen={false} />);

    expect(document.querySelector(".overlay")).toBeNull();
  });

  it("covers the page when open", () => {
    render(<Spinner isOpen />);

    expect(document.querySelector(".overlay")).not.toBeNull();
  });

  it("cannot be dismissed", () => {
    render(<Spinner isOpen />);

    // Deliberate: the overlay means work is in flight, and letting a user
    // dismiss it would hide that the work is still running rather than stop
    // it. The dialogs it must never cover are pinned by deleteFlowOrder and
    // deleteTeamFlowOrder.
    const overlay = document.querySelector(".overlay");
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelector(".overlay")).not.toBeNull();
  });
});
