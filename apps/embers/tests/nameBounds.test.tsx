import { renderToStaticMarkup } from "react-dom/server";

import { NAME_MAX_LENGTH, nameField } from "@/lib/forms/nameField";
import { Grid } from "@/pages/Dashboard/components/Grid";

// A name is user-supplied text of no natural length, rendered into a card of a fixed
// 200px. That is the sidebar's defect in another place: a container of fixed size
// meeting content of unbounded size, with the content losing silently.
//
// Two halves, neither sufficient alone. Validation bounds names created from now on;
// the card's clamp contains the ones already written to chain, which validation
// cannot reach because the records are immutable.

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const name = nameField();

describe("the name bound", () => {
  it("accepts an ordinary name", () => {
    expect(name.safeParse("Refine").success).toBe(true);
  });

  it("still rejects an empty name", () => {
    // The bound was added on top of an existing rule, which must survive it.
    expect(name.safeParse("").success).toBe(false);
  });

  it("accepts a name of exactly the maximum length", () => {
    expect(name.safeParse("x".repeat(NAME_MAX_LENGTH)).success).toBe(true);
  });

  it("rejects a name one character too long", () => {
    // Pins the boundary itself, not merely that some long name is rejected.
    expect(name.safeParse("x".repeat(NAME_MAX_LENGTH + 1)).success).toBe(false);
  });

  it("rejects the kind of name that broke the layout", () => {
    expect(name.safeParse("A".repeat(400)).success).toBe(false);
  });
});

describe("the dashboard card", () => {
  it("clamps a name it cannot bound", () => {
    // Names already on chain predate the validation and cannot be shortened: the
    // record is immutable. Without the clamp such a name overflows its card and
    // pushes the whole grid out of shape.
    const markup = renderToStaticMarkup(
      <Grid
        data={[
          {
            createdAt: new Date(0),
            id: "a",
            name: "A".repeat(400),
            type: "normal",
          },
        ]}
        icon={() => null}
        title="new"
        onCreate={() => undefined}
        onDelete={() => undefined}
        onNavigate={() => undefined}
      />,
    );

    expect(markup).toContain("agent-name");
  });
});
