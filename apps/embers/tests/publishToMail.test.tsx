/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PublishToMail from "@/pages/PublishToMail/PublishToMail";

// Binding a mail address is the lighter publish: no external account, no key
// material, reversible deactivation. What must hold: the current active
// binding is shown with its unpublish affordance, submission sends exactly the
// local part and domain the form holds, and the success path surfaces the
// canonical address the backend echoed.

const mockAlert = jest.fn(async (..._args: unknown[]) => Promise.resolve());
jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useAlert: () => mockAlert,
}));

jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args),
}));

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({
    agentsTeam: { id: "team-1", name: "Research Crew", version: "v1" },
  }),
}));

const mockPublish = jest.fn(async (..._args: unknown[]) =>
  Promise.resolve({
    prepareResponse: { response: { address: "research-crew@agents.test" } },
  }),
);
const mockUnpublish = jest.fn(async (..._args: unknown[]) =>
  Promise.resolve({}),
);

let mockMail: { active: boolean; address: string; reachable: null }[] = [];
jest.mock("@/lib/queries", () => ({
  usePublishedChannels: () => ({
    data: {
      chat: { activeGrantCount: "0", principals: [] },
      firesky: null,
      mail: mockMail,
    },
  }),
  usePublishToMailMutation: () => ({ mutateAsync: mockPublish }),
  useUnpublishMailMutation: () => ({ mutateAsync: mockUnpublish }),
}));

beforeEach(() => {
  mockAlert.mockClear();
  mockPublish.mockClear();
  mockUnpublish.mockClear();
  mockMail = [];
});

describe("publish to mail", () => {
  it("submits the local part and domain the form holds", async () => {
    render(<PublishToMail />);

    fireEvent.change(screen.getByTestId("mail-local-part"), {
      target: { value: "Research-Crew" },
    });
    fireEvent.change(screen.getByTestId("mail-domain"), {
      target: { value: "agents.test" },
    });
    fireEvent.submit(
      screen.getByTestId("publish-to-mail").querySelector("form")!,
    );

    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith({
        localPart: "Research-Crew",
        mailDomain: "agents.test",
      });
    });
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the active binding with its unpublish affordance", () => {
    mockMail = [
      { active: true, address: "research-crew@agents.test", reachable: null },
    ];
    render(<PublishToMail />);

    expect(screen.getByTestId("mail-current-binding")).toBeTruthy();
    expect(screen.getByTestId("mail-unpublish")).toBeTruthy();
  });

  it("unpublishes the current binding through the mutation", async () => {
    mockMail = [
      { active: true, address: "research-crew@agents.test", reachable: null },
    ];
    render(<PublishToMail />);

    fireEvent.click(
      screen.getByTestId("mail-unpublish").querySelector("button")!,
    );

    await waitFor(() => {
      expect(mockUnpublish).toHaveBeenCalledWith("team-1");
    });
  });

  it("hides the current-binding block when nothing is bound", () => {
    render(<PublishToMail />);
    expect(screen.queryByTestId("mail-current-binding")).toBeNull();
  });
});
