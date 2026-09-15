import { renderToStaticMarkup } from "react-dom/server";

import {
  useReferencingTeamsReader,
  useTeamPublicationReader,
} from "@/lib/queries";

// Both deletions ask a question first -- "which teams use this agent", "is this team
// published" -- and act on the answer by destroying things. So the answer has to be
// about the record being deleted, at the moment it is deleted.
//
// The first attempt asked through a `useQuery` keyed by component state. React state
// does not update within the callback that sets it, so the refetch ran against the
// key from the *previous* render: `undefined` on the first deletion, and the
// previously deleted record on every one after. Not a stale cache -- a wrong answer,
// acted on by deleting the teams it named.

jest.mock("@/lib/providers/wallet/useApi", () => ({
  useApi: () => ({ wallets: { address: "wallet-1" } }),
}));

jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useAlert: () => jest.fn(),
  useConfirm: () => jest.fn(),
}));

const requested: string[] = [];
let respond: () => Response;

/** Captures each request rather than making one. */
const stubFetch = async (input: unknown) => {
  requested.push(String(input));
  return Promise.resolve(respond());
};

/** Runs a hook and hands its result back, without a DOM. */
function mount<T>(useHook: () => T): T {
  const captured: { value: T | null } = { value: null };
  const Probe = () => {
    // The probe exists solely to hand the hook's result back out of the render.
    // eslint-disable-next-line react-hooks/immutability
    captured.value = useHook();
    return null;
  };

  renderToStaticMarkup(<Probe />);

  if (captured.value === null) {
    throw new Error("the probe never rendered");
  }
  return captured.value;
}

beforeEach(() => {
  requested.length = 0;
  // The node environment has no `window`; the readers take their base URL from it,
  // exactly as the app does at runtime.
  (globalThis as unknown as { window: { API_URL: string } }).window = {
    API_URL: "http://api.test",
  };
  (globalThis as unknown as { fetch: typeof stubFetch }).fetch = stubFetch;
  respond = () => new Response("[]", { status: 200 });
});

describe("the referencing-teams reader", () => {
  it("asks about the agent it is given, every time", async () => {
    const read = mount(useReferencingTeamsReader);

    await read("agent-a");
    await read("agent-b");

    expect(requested).toEqual([
      "http://api.test/api/ai-agents-teams/wallet-1/referencing/agent-a",
      "http://api.test/api/ai-agents-teams/wallet-1/referencing/agent-b",
    ]);
  });

  it("never asks about an undefined agent", () => {
    // What the state-keyed query did on the very first deletion.
    expect(requested.some((url) => url.includes("undefined"))).toBe(false);
  });

  it("fails rather than reporting no teams when the read fails", async () => {
    // An under-reported list understates what a deletion is about to destroy, and
    // the caller acts on it by deleting.
    respond = () => new Response("node unreachable", { status: 500 });
    const read = mount(useReferencingTeamsReader);

    await expect(read("agent-a")).rejects.toThrow("node unreachable");
  });
});

describe("the team-publication reader", () => {
  it("asks about the team it is given, every time", async () => {
    respond = () => new Response("null", { status: 404 });
    const read = mount(useTeamPublicationReader);

    await read("team-a");
    await read("team-b");

    expect(requested).toEqual([
      "http://api.test/api/ai-agents-teams/wallet-1/team-a/published",
      "http://api.test/api/ai-agents-teams/wallet-1/team-b/published",
    ]);
  });

  it("reads a 404 as never published rather than as a failure", async () => {
    // A team that was never published is the ordinary case; failing on it would
    // block every deletion of an unpublished team.
    respond = () => new Response("", { status: 404 });
    const read = mount(useTeamPublicationReader);

    await expect(read("team-a")).resolves.toBeNull();
  });

  it("fails rather than assuming unpublished when the read fails", async () => {
    // Treating an unreachable node as "not published" would skip the unpublish and
    // leave the handle answering mentions for a team that no longer exists.
    respond = () => new Response("node unreachable", { status: 502 });
    const read = mount(useTeamPublicationReader);

    await expect(read("team-a")).rejects.toThrow("node unreachable");
  });
});
