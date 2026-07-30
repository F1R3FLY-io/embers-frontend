import { renderToStaticMarkup } from "react-dom/server";

import { Header } from "@/lib/layouts/Graph/Header";

// The primary button can only offer one action, so on a deployed team it reads
// Run and both deploying again and publishing lose their entry point. The caret
// beside it is where they live, and these assert it appears exactly when those
// actions are valid.
//
// Translation is mocked to return the key, so labels assert as "basic.run" and
// "deploy.publishToFiresky" -- which also pins the keys themselves, since a typo
// in one would otherwise render an empty button.

// Must be prefixed `mock` to be visible inside a hoisted jest.mock factory.
let mockTeam: Record<string, unknown> = {};
let mockPublished: Record<string, unknown> | null = null;

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({
    agentsTeam: mockTeam,
    reset: () => undefined,
    update: () => undefined,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => () => undefined,
}));

jest.mock("@/lib/providers/dock/useDock", () => ({
  useDock: () => ({ appendLog: () => undefined }),
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({ close: () => undefined, open: () => undefined }),
}));

jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader: (fn: unknown) => fn,
}));

jest.mock("@/lib/providers/loader/useMutationResultWithLoader", () => ({
  useMutationResultWithLoader: () => ({
    mutateAsync: async () => Promise.resolve(undefined),
  }),
}));

jest.mock("@/lib/queries", () => ({
  useCreateAgentsTeamMutation: () => ({
    mutateAsync: async () => Promise.resolve(undefined),
  }),
  useRunAgentsTeamMutation: () => ({
    mutateAsync: async () => Promise.resolve(undefined),
  }),
  useSaveAgentsTeamMutation: () => ({
    mutateAsync: async () => Promise.resolve(undefined),
  }),
  useTeamPublishedState: () => ({ data: mockPublished }),
}));

beforeEach(() => {
  mockPublished = null;
});

const render = (team: Record<string, unknown>) => {
  mockTeam = team;
  return renderToStaticMarkup(<Header />);
};

const DEPLOYED = { id: "team-1", uri: "rho:id:abc", version: "v1" };
const DRAFT = { id: "team-1", version: "v1" };

describe("graph editor header", () => {
  it("offers the menu once the team is deployed", () => {
    const markup = render(DEPLOYED);

    expect(markup).toContain('aria-haspopup="menu"');
    expect(markup).toContain("deploy.moreActions");
  });

  it("offers no menu before the team is deployed", () => {
    // Publishing an undeployed team is rejected by the server, and a second
    // deploy is not yet a re-deploy, so there is nothing for the menu to hold.
    const markup = render(DRAFT);

    expect(markup).not.toContain('aria-haspopup="menu"');
  });

  it("reads Run on a deployed team with no pending edits", () => {
    expect(render(DEPLOYED)).toContain("basic.run");
  });

  it("reads Deploy while edits are unsaved, so deploying stays one click", () => {
    const markup = render({ ...DEPLOYED, hasGraphChanges: true });

    expect(markup).toContain("deploy.deploy");
    expect(markup).not.toContain("basic.run");
  });

  it("keeps Save as Draft available in both states", () => {
    expect(render(DEPLOYED)).toContain("deploy.saveAsDraft");
    expect(render(DRAFT)).toContain("deploy.saveAsDraft");
  });

  it("squares the seam only when the caret is there to join", () => {
    // The primary button keeps its normal rounding when it stands alone;
    // otherwise it would look like half of a control that is not there.
    expect(render(DEPLOYED)).toContain("split-main");
    expect(render(DRAFT)).not.toContain("split-main");
  });

  it("names the caret for a screen reader", () => {
    // It is icon-only, so without a label it announces nothing at all.
    expect(render(DEPLOYED)).toContain('aria-label="deploy.moreActions"');
  });

  it("reports the menu as closed until it is opened", () => {
    expect(render(DEPLOYED)).toContain('aria-expanded="false"');
  });

  // The publish label names what the action would actually do. Each of these states
  // was previously indistinguishable to the client, so the menu always read
  // "Publish" -- including when the account it referred to no longer existed.
  describe("the publish action's label", () => {
    it("says Publish when nothing is published yet", () => {
      mockPublished = null;

      expect(render(DEPLOYED)).toContain("deploy.publishToFiresky");
    });

    it("says Re-publish once a live publication exists", () => {
      mockPublished = {
        account_exists: true,
        handle: "team.test",
        is_latest_deployment: true,
      };

      expect(render(DEPLOYED)).toContain("deploy.republishToFiresky");
    });

    it("calls out an account that no longer exists", () => {
      // What a wiped PDS leaves behind: the chain still records the publication.
      mockPublished = {
        account_exists: false,
        handle: "team.test",
        is_latest_deployment: true,
      };

      expect(render(DEPLOYED)).toContain("deploy.republishAccountMissing");
    });

    it("calls out a publication left on an older deployment", () => {
      mockPublished = {
        account_exists: true,
        handle: "team.test",
        is_latest_deployment: false,
      };

      expect(render(DEPLOYED)).toContain("deploy.publishStale");
    });

    it("does not claim an account is missing merely because it could not be checked", () => {
      // null means unreachable PDS or a publish predating handles being recorded.
      // Reporting that as "missing" would cry wolf every time the PDS blinked.
      mockPublished = {
        account_exists: null,
        handle: null,
        is_latest_deployment: true,
      };

      const markup = render(DEPLOYED);
      expect(markup).toContain("deploy.republishToFiresky");
      expect(markup).not.toContain("deploy.republishAccountMissing");
    });
  });
});
