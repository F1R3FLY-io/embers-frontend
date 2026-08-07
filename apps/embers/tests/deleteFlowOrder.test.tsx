import { renderToStaticMarkup } from "react-dom/server";

// The order contract of the dashboard delete flow, without a DOM: the
// referencing-teams read and the cascade each run under their own loader
// wrap, and the confirmation (or the failure alert) is awaited while the
// loader is idle -- the spinner overlay renders above every modal, so a
// dialog awaited under it would be unanswerable. The provider-level
// counterpart lives in modalDismissal.test.tsx; this suite pins the flow
// in AgentsTab itself.

const loaderCalls = { hides: 0, shows: 0 };
const loaderIdle = () => loaderCalls.shows === loaderCalls.hides;

const mockConfirm = jest.fn<Promise<boolean>, [unknown]>();
const mockAlert = jest.fn<Promise<undefined>, [unknown]>();
const confirmSeenLoaderIdle = jest.fn<undefined, [boolean]>();
const alertSeenLoaderIdle = jest.fn<undefined, [boolean]>();

let mockReferencingTeams: (id: string) => Promise<{ id: string }[]>;
const mockDeleteAgent = jest.fn(async (id: string) => Promise.resolve({ id }));
const mockDeleteTeam = jest.fn(async (id: unknown) => Promise.resolve({ id }));
const mockUnpublishTeam = jest.fn(async (id: unknown) =>
  Promise.resolve({ id }),
);

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
  useAgents: () => ({ data: { agents: [] } }),
  useDeleteAgentMutation: () => ({ mutateAsync: mockDeleteAgent }),
  useDeleteAgentsTeamMutation: () => ({ mutateAsync: mockDeleteTeam }),
  useReferencingTeamsReader: () => async (id: string) =>
    mockReferencingTeams(id),
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

import AgentsTab from "@/pages/Dashboard/components/AgentsTab/AgentsTab";

function mountOnDelete() {
  renderToStaticMarkup(<AgentsTab searchQuery="" sortBy="name" />);
  if (captured.onDelete === null) {
    throw new Error("the grid never rendered");
  }
  return captured.onDelete;
}

const flush = async () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

beforeEach(() => {
  loaderCalls.shows = 0;
  loaderCalls.hides = 0;
  captured.onDelete = null;
  jest.clearAllMocks();
  mockReferencingTeams = async (id: string) =>
    Promise.resolve([{ id: `team-of-${id}` }]);
  mockConfirm.mockResolvedValue(true);
  mockAlert.mockResolvedValue(undefined);
});

it("asks for confirmation only while the loader is idle, then works under it", async () => {
  const onDelete = mountOnDelete();

  onDelete("agent-1", "Refine");
  await flush();
  await flush();

  expect(mockConfirm).toHaveBeenCalledTimes(1);
  // The read ran under its own loader wrap and released it before the dialog.
  expect(confirmSeenLoaderIdle).toHaveBeenCalledWith(true);
  expect(loaderCalls.shows).toBeGreaterThanOrEqual(2);
  expect(loaderCalls.hides).toBe(loaderCalls.shows);
  expect(mockDeleteAgent).toHaveBeenCalledWith("agent-1");
});

it("a declined confirmation runs no cascade and leaves the loader idle", async () => {
  mockConfirm.mockResolvedValue(false);
  const onDelete = mountOnDelete();

  onDelete("agent-1", "Refine");
  await flush();
  await flush();

  expect(mockDeleteAgent).not.toHaveBeenCalled();
  expect(mockDeleteTeam).not.toHaveBeenCalled();
  expect(mockUnpublishTeam).not.toHaveBeenCalled();
  expect(loaderCalls.hides).toBe(loaderCalls.shows);
});

it("a failed referencing read alerts while the loader is idle and deletes nothing", async () => {
  mockReferencingTeams = async () =>
    Promise.reject(new Error("node unresponsive"));
  const onDelete = mountOnDelete();

  onDelete("agent-1", "Refine");
  await flush();
  await flush();

  expect(mockAlert).toHaveBeenCalledTimes(1);
  expect(alertSeenLoaderIdle).toHaveBeenCalledWith(true);
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(mockDeleteAgent).not.toHaveBeenCalled();
  expect(loaderCalls.hides).toBe(loaderCalls.shows);
});
