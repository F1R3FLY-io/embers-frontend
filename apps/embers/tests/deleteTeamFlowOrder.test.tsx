import { renderToStaticMarkup } from "react-dom/server";

import type { PublishedState } from "@/lib/publishedState";

// The order contract of the dashboard team-delete flow, without a DOM: the
// publication read and the removal each run under their own loader wrap, and
// the confirmation (or the failure alert) is awaited while the loader is idle
// -- the spinner overlay renders above every modal, so a dialog awaited under
// it would be unanswerable. The agent-tab counterpart lives in
// deleteFlowOrder.test.tsx and the provider-level one in
// modalDismissal.test.tsx; this suite pins the flow in AgentTeamsTab itself,
// which kept the pre-fix shape after the agent tab was corrected.

const loaderCalls = { hides: 0, shows: 0 };
const loaderIdle = () => loaderCalls.shows === loaderCalls.hides;

const mockConfirm = jest.fn<Promise<boolean>, [unknown]>();
const mockAlert = jest.fn<Promise<undefined>, [unknown]>();
const confirmSeenLoaderIdle = jest.fn<undefined, [boolean]>();
const alertSeenLoaderIdle = jest.fn<undefined, [boolean]>();

let mockTeamPublication: (id: string) => Promise<PublishedState | null>;

// Removal order matters more than the individual calls: unpublishing needs
// credentials reached through the team, so a delete that ran first would strand
// a handle answering mentions with nothing left to stop it through.
const removalOrder: string[] = [];
const mockDeleteTeam = jest.fn(async (id: string) => {
  removalOrder.push("delete");
  return Promise.resolve({ id });
});
const mockUnpublishTeam = jest.fn(async (id: string) => {
  removalOrder.push("unpublish");
  return Promise.resolve({ id });
});

jest.mock("@/lib/providers/loader/useLoader", () => ({
  useLoader: () => ({
    hide: () => {
      loaderCalls.hides += 1;
    },
    show: () => {
      loaderCalls.shows += 1;
    },
  }),
}));

jest.mock("@/lib/providers/loader/useMutationResultWithLoader", () => ({
  useMutationResultWithLoader: (mutation: unknown) => mutation,
}));

jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useAlert: () => async (opts: unknown) => {
    alertSeenLoaderIdle(loaderIdle());
    return mockAlert(opts);
  },
  useConfirm: () => async (opts: unknown) => {
    confirmSeenLoaderIdle(loaderIdle());
    return mockConfirm(opts);
  },
}));

jest.mock("@/lib/queries", () => ({
  useAgentsTeams: () => ({ data: { agentsTeams: [] } }),
  useDeleteAgentsTeamMutation: () => ({ mutateAsync: mockDeleteTeam }),
  useTeamPublicationReader: () => async (id: string) => mockTeamPublication(id),
  useUnpublishAgentsTeamMutation: () => ({ mutateAsync: mockUnpublishTeam }),
}));

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

type GridProps = { onDelete: (id: string, name: string) => void };
const captured: { onDelete: GridProps["onDelete"] | null } = { onDelete: null };
jest.mock("@/pages/Dashboard/components/Grid", () => ({
  Grid: (props: GridProps) => {
    captured.onDelete = props.onDelete;
    return null;
  },
}));

import AgentTeamsTab from "@/pages/Dashboard/components/AgentTeamsTab/AgentTeamsTab";

function mountOnDelete() {
  renderToStaticMarkup(<AgentTeamsTab searchQuery="" sortBy="name" />);
  if (captured.onDelete === null) {
    throw new Error("the grid never rendered");
  }
  return captured.onDelete;
}

function publishedState(
  overrides: Partial<PublishedState> = {},
): PublishedState {
  return {
    account_exists: true,
    active: true,
    did: "did:plc:team",
    handle: "research-desk.test",
    is_latest_deployment: true,
    published_version: "v1",
    uri: "rho:id:team",
    ...overrides,
  };
}

const flush = async () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

beforeEach(() => {
  loaderCalls.shows = 0;
  loaderCalls.hides = 0;
  captured.onDelete = null;
  removalOrder.length = 0;
  jest.clearAllMocks();
  mockTeamPublication = async () => Promise.resolve(null);
  mockConfirm.mockResolvedValue(true);
  mockAlert.mockResolvedValue(undefined);
});

it("asks for confirmation only while the loader is idle, then works under it", async () => {
  const onDelete = mountOnDelete();

  onDelete("team-1", "Research Desk");
  await flush();
  await flush();

  expect(mockConfirm).toHaveBeenCalledTimes(1);
  // The publication read ran under its own loader wrap and released it before
  // the dialog.
  expect(confirmSeenLoaderIdle).toHaveBeenCalledWith(true);
  expect(loaderCalls.shows).toBeGreaterThanOrEqual(2);
  expect(loaderCalls.hides).toBe(loaderCalls.shows);
  expect(mockDeleteTeam).toHaveBeenCalledWith("team-1");
});

it("a declined confirmation removes nothing and leaves the loader idle", async () => {
  mockConfirm.mockResolvedValue(false);
  const onDelete = mountOnDelete();

  onDelete("team-1", "Research Desk");
  await flush();
  await flush();

  expect(mockDeleteTeam).not.toHaveBeenCalled();
  expect(mockUnpublishTeam).not.toHaveBeenCalled();
  expect(loaderCalls.hides).toBe(loaderCalls.shows);
});

it("a failed publication read alerts while the loader is idle and deletes nothing", async () => {
  mockTeamPublication = async () =>
    Promise.reject(new Error("node unresponsive"));
  const onDelete = mountOnDelete();

  onDelete("team-1", "Research Desk");
  await flush();
  await flush();

  expect(mockAlert).toHaveBeenCalledTimes(1);
  expect(alertSeenLoaderIdle).toHaveBeenCalledWith(true);
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(mockDeleteTeam).not.toHaveBeenCalled();
  expect(loaderCalls.hides).toBe(loaderCalls.shows);
});

it("stops a published team answering mentions before removing it", async () => {
  mockTeamPublication = async () => Promise.resolve(publishedState());
  const onDelete = mountOnDelete();

  onDelete("team-1", "Research Desk");
  await flush();
  await flush();

  expect(removalOrder).toEqual(["unpublish", "delete"]);
  expect(mockUnpublishTeam).toHaveBeenCalledWith("team-1");
  expect(mockDeleteTeam).toHaveBeenCalledWith("team-1");
  expect(loaderCalls.hides).toBe(loaderCalls.shows);
});

it("names the handle that will stop responding before asking to confirm", async () => {
  mockTeamPublication = async () =>
    Promise.resolve(publishedState({ handle: "research-desk.test" }));
  const onDelete = mountOnDelete();

  onDelete("team-1", "Research Desk");
  await flush();
  await flush();

  const [{ message }] = mockConfirm.mock.calls[0] as [{ message: string }];
  expect(message).toContain("@research-desk.test");
  expect(confirmSeenLoaderIdle).toHaveBeenCalledWith(true);
});
