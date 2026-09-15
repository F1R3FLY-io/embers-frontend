/**
 * @jest-environment jsdom
 */
import { ApiError } from "@f1r3fly-io/embers-client-sdk";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import z from "zod";

import { Input } from "@/lib/components/Input";
import { FormError } from "@/lib/forms/FormError";
import { fieldError, useForm } from "@/lib/forms/useForm";

function Example({ submit }: { submit: () => Promise<void> }) {
  const form = useForm({
    defaultValues: { email: "", name: "" },
    onSubmit: submit,
    validators: {
      onChange: z.object({
        email: z.email("Enter a valid email."),
        name: z.string().min(1, "Enter a name."),
      }),
    },
  });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <Input
            aria-label="Name"
            errorMessage={fieldError(field.state.meta)}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>
      <form.Field name="email">
        {(field) => (
          <Input
            aria-label="Email"
            errorMessage={fieldError(field.state.meta)}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.errorMap.onServer}>
        {(error) => <FormError error={error} />}
      </form.Subscribe>
      <button type="submit">Save</button>
    </form>
  );
}

it("shows every invalid field, associates messages, and focuses the first", async () => {
  const submit = jest.fn();
  const user = userEvent.setup();
  render(<Example submit={submit} />);
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.getByLabelText("Name")).toHaveFocus());
  expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
    "Enter a name.",
  );
  expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
    "Enter a valid email.",
  );
  expect(submit).not.toHaveBeenCalled();
});

it("maps server errors to fields and lets corrections submit successfully", async () => {
  const submit = jest
    .fn()
    .mockRejectedValueOnce(
      new ApiError("Review the name.", 422, { name: ["Name is taken."] }),
    )
    .mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<Example submit={submit} />);
  await user.type(screen.getByLabelText("Name"), "Team");
  await user.type(screen.getByLabelText("Email"), "team@example.com");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
      "Name is taken.",
    ),
  );
  await user.type(screen.getByLabelText("Name"), "Two");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText("Name")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(screen.queryByText("Review the name.")).not.toBeInTheDocument();
});
