/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import PublishAgentsTeam from "@/pages/PublishAgentsTeam/PublishAgentsTeam";
import { teamHandleSlug } from "@/pages/PublishAgentsTeam/teamHandleSlug";

// A published team's handle is its public face on F1r3sky: it must default to
// something a reader can attribute to the team ("research-desk") rather than
// an opaque token, while remaining a valid AT protocol DNS label and fully
// editable in the form.

jest.mock("@/lib/components/LanguageFooter", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({
    agentsTeam: { id: "team-1", name: "Research Desk", version: "v1" },
    reset: () => undefined,
    update: () => undefined,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({ close: () => undefined, open: jest.fn() }),
}));

jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useAlert: () => jest.fn(),
}));

jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader: (fn: unknown) => fn,
}));

/* eslint-disable @typescript-eslint/promise-function-async
   -- inert mocks: `async` would trip require-await, and a plain value would
   not satisfy the mutateAsync signature the component awaits. */
jest.mock("@/lib/providers/loader/useMutationResultWithLoader", () => ({
  useMutationResultWithLoader: () => ({
    mutateAsync: () => Promise.resolve(undefined),
  }),
}));

jest.mock("@/lib/queries", () => ({
  usePublishAgentsTeamToFireskyMutation: () => ({
    mutateAsync: () => Promise.resolve(undefined),
  }),
  useUnpublishAgentsTeamMutation: () => ({
    mutateAsync: () => Promise.resolve(undefined),
  }),
}));
/* eslint-enable @typescript-eslint/promise-function-async */

describe("teamHandleSlug", () => {
  it("slugifies a team name into a DNS-label-safe handle", () => {
    expect(teamHandleSlug("Research Desk")).toBe("research-desk");
  });

  it("collapses punctuation runs and trims edge hyphens", () => {
    expect(teamHandleSlug("  Q&A -- Support Bot!  ")).toBe("q-a-support-bot");
  });

  it("caps the label length without leaving a trailing hyphen", () => {
    const slug = teamHandleSlug(`${"a".repeat(28)} team of many words`);
    expect(slug.length).toBeLessThanOrEqual(30);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("falls back to a generic label when nothing survives", () => {
    expect(teamHandleSlug(undefined)).toBe("team");
    expect(teamHandleSlug("!!!")).toBe("team");
  });
});

describe("the publish form's handle default", () => {
  it("seeds the handle field from the team name", () => {
    render(<PublishAgentsTeam />);

    const handleInput =
      screen.getByPlaceholderText<HTMLInputElement>("Username");
    expect(handleInput.value).toBe("research-desk");
  });
});
