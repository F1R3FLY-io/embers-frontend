/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const openModal = jest.fn();
const alert = jest.fn();
const publishMutate = jest.fn();
const unpublishMutate = jest.fn();
let publishBoundTeamId: string | undefined;

const agentsTeam = {
  id: "team-1",
  logo: "logo.png",
  name: "Research Desk",
  version: "version-1",
};

jest.mock("@/lib/queries", () => ({
  usePublishAgentsTeamToFireskyMutation: (id: string) => {
    publishBoundTeamId = id;
    return { mutateAsync: publishMutate };
  },
  useUnpublishAgentsTeamMutation: () => ({ mutateAsync: unpublishMutate }),
}));

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({ agentsTeam }),
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({ close: jest.fn(), open: openModal }),
}));

jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useAlert: () => alert,
  useConfirm: () => jest.fn(),
}));

jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader:
    (fn: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) =>
      fn(...args),
}));
jest.mock("@/lib/providers/loader/useMutationResultWithLoader", () => ({
  useMutationResultWithLoader: (mutation: unknown) => mutation,
}));
jest.mock("@/lib/providers/loader/useLoader", () => ({
  useLoader: () => ({ hide: jest.fn(), show: jest.fn() }),
}));

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import PublishAgentsTeam from "@/pages/PublishAgentsTeam/PublishAgentsTeam";

// Publishing a team to F1R3SKY, and stopping it again.
//
// Only the handle default and the success modal's own rendering were covered.
// The submit path and the unpublish action were not -- and unpublish is the one
// that matters most, because the button used to close the modal and do nothing
// while telling the user it had worked, leaving a handle answering mentions the
// user believed it had stopped answering.

beforeEach(() => {
  jest.clearAllMocks();
  window.API_URL = "http://localhost:8080";
  delete window.FIRESKY_PDS_URL;
  delete window.FIRESKY_DEMO_PDS_URL;
  global.fetch = jest.fn().mockResolvedValue({
    json: async () =>
      Promise.resolve({
        availableUserDomains: [".test", ".example"],
        inviteCodeRequired: false,
      }),
    ok: true,
  });
  // Stands in for react-query's mutateAsync, which invokes the caller's
  // onSuccess. Resolving without calling it would mean no test ever exercised
  // the success path.
  publishMutate.mockImplementation(
    // Stands in for a promise-returning call and settles without awaiting.
    // eslint-disable-next-line @typescript-eslint/require-await
    async (_value: unknown, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    },
  );
  unpublishMutate.mockResolvedValue(undefined);
  alert.mockResolvedValue(undefined);
});

async function fillAndSubmit(
  overrides: { email?: string; password?: string; pdsUrl?: string } = {},
) {
  const user = userEvent.setup();
  render(<PublishAgentsTeam />);

  const email = overrides.email ?? "team@example.test";
  const password = overrides.password ?? "hunter2hunter2";
  const pdsUrl = overrides.pdsUrl ?? "http://localhost:2583";

  // Addressed by placeholder rather than position: the form opens with a
  // read-only "Agent name" field, so positional indices silently point one
  // field earlier than intended.
  await user.clear(screen.getByPlaceholderText("https://"));
  await user.type(screen.getByPlaceholderText("https://"), pdsUrl);
  await user.clear(screen.getByPlaceholderText("you@example.com"));
  await user.type(screen.getByPlaceholderText("you@example.com"), email);
  await user.clear(screen.getByPlaceholderText("Enter password"));
  await user.type(screen.getByPlaceholderText("Enter password"), password);

  if (/^https?:/.test(pdsUrl)) {
    await screen.findByRole("combobox", { name: "Handle suffix" });
  }
  await user.click(screen.getByRole("button", { name: "publish.button" }));
  return user;
}

describe("publishing", () => {
  it("publishes the team currently open", () => {
    render(<PublishAgentsTeam />);

    // The mutation is bound to an id at hook time; a mismatch would publish a
    // different team under this one's handle.
    expect(publishBoundTeamId).toBe("team-1");
  });

  it("defaults the handle from the team name", () => {
    render(<PublishAgentsTeam />);

    // The handle field, not the read-only agent-name field above it.
    const handle = screen.getByPlaceholderText<HTMLInputElement>("Username");
    // Derived from the team name so the user is not asked to invent one; the
    // exact slug rule is pinned by publishHandleDefault.test.tsx.
    expect(handle.value.toLowerCase()).toContain("research");
  });

  it("sends the credentials the user supplied", async () => {
    await fillAndSubmit();

    expect(publishMutate).toHaveBeenCalledTimes(1);
    const [credentials] = publishMutate.mock.calls[0] as [unknown];
    expect(credentials).toMatchObject({
      email: "team@example.test",
      pdsUrl: "http://localhost:2583",
    });
  });

  it("refuses to submit an invalid PDS address", async () => {
    await fillAndSubmit({ pdsUrl: "not-a-url" });

    // The address decides which server the team's credentials are sent to, so
    // a malformed one must not reach the network at all.
    expect(publishMutate).not.toHaveBeenCalled();
  });

  it("refuses to submit an invalid email", async () => {
    await fillAndSubmit({ email: "not-an-email" });

    expect(publishMutate).not.toHaveBeenCalled();
  });

  it("confirms success to the user", async () => {
    await fillAndSubmit();

    expect(openModal).toHaveBeenCalledTimes(1);
    const [, options] = openModal.mock.calls[0] as [unknown, unknown];
    expect(options).toMatchObject({
      ariaLabel: "Success deploy",
    });
  });

  it("shows the reason when publishing fails", async () => {
    publishMutate.mockRejectedValue(new Error("handle already taken"));
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "handle already taken",
    );
    expect(openModal).not.toHaveBeenCalled();
  });
});

describe("unpublishing from the success dialog", () => {
  /** Runs a successful publish and returns the dialog's onUnpublish handler. */
  async function openSuccessDialog() {
    publishMutate.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await -- see above.
      async (_value: unknown, options: { onSuccess: () => void }) => {
        options.onSuccess();
      },
    );
    await fillAndSubmit();

    const [dialog] = openModal.mock.calls[0] as [
      { props: { onUnpublish: () => void } },
    ];
    return dialog.props.onUnpublish;
  }

  it("actually stops the team answering mentions", async () => {
    const onUnpublish = await openSuccessDialog();

    onUnpublish();

    // The button used to close the modal and do nothing while reporting
    // success. This is the assertion that it reaches the mutation at all.
    expect(unpublishMutate).toHaveBeenCalledWith("team-1");
  });

  it("tells the user the handle is kept", async () => {
    const onUnpublish = await openSuccessDialog();

    onUnpublish();
    await Promise.resolve();
    await Promise.resolve();

    // Naming the handle and saying the account survives is what stops a user
    // assuming they have destroyed something recoverable.
    expect(alert).toHaveBeenCalledTimes(1);
    const [{ message }] = alert.mock.calls[0] as [{ message: string }];
    expect(message).toContain("no longer respond");
    expect(message).toContain("publish to it again");
  });

  it("stays silent when unpublishing fails, because the mutation reports it", async () => {
    const onUnpublish = await openSuccessDialog();
    unpublishMutate.mockRejectedValue(new Error("pds unreachable"));

    onUnpublish();
    await Promise.resolve();
    await Promise.resolve();

    // The mutation surfaces its own failure. A second dialog here would read
    // as a second, separate failure rather than one thing going wrong.
    expect(alert).not.toHaveBeenCalled();
  });
});

describe("publication defaults and field feedback", () => {
  it("appends a discovered suffix once and publishes the complete handle", async () => {
    await fillAndSubmit();
    expect(
      (publishMutate.mock.calls[0] as [{ handle: string }])[0].handle,
    ).toBe("research-desk.test");
  });
  it("keeps production credentials empty", () => {
    window.FIRESKY_PDS_URL = "https://pds.example.org";
    render(<PublishAgentsTeam />);
    expect(screen.getByPlaceholderText("you@example.com")).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter password")).toHaveValue("");
  });
  it("prefills only the configured demo and clears generated credentials when leaving it", async () => {
    window.FIRESKY_PDS_URL = "http://localhost:2583";
    window.FIRESKY_DEMO_PDS_URL = "http://localhost:2583";
    const user = userEvent.setup();
    render(<PublishAgentsTeam />);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("you@example.com")).toHaveValue(
        "research-desk@example.com",
      ),
    );
    expect(screen.getByPlaceholderText("Enter password")).toHaveValue(
      "password123",
    );
    await user.clear(screen.getByPlaceholderText("https://"));
    await user.type(
      screen.getByPlaceholderText("https://"),
      "https://pds.example.org",
    );
    expect(screen.getByPlaceholderText("you@example.com")).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter password")).toHaveValue("");
  });
  it("existing-account mode does not ask for email", async () => {
    const user = userEvent.setup();
    render(<PublishAgentsTeam />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Team social account" }),
      "existing",
    );
    expect(
      screen.queryByPlaceholderText("you@example.com"),
    ).not.toBeInTheDocument();
  });
  it("places server validation beside the handle and focuses it", async () => {
    const { ApiError } = await import("@f1r3fly-io/embers-client-sdk");
    publishMutate.mockRejectedValue(
      new ApiError("Handle needs a supported suffix.", 422, {
        handle: ["Add .test or .example."],
      }),
    );
    await fillAndSubmit();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Username")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(screen.getByPlaceholderText("Username")).toHaveAccessibleDescription(
      "Add .test or .example.",
    );
  });
});
