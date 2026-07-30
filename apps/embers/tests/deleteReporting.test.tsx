import type { UseMutationResult } from "@tanstack/react-query";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";

import { useDeleteAgentMutation } from "@/lib/queries";

// Two defects, one mutation.
//
// A rejected delete used to roll the optimistic removal back and discard the error:
// the row vanished, silently came back, and nothing said why. A delete rejected on
// chain was indistinguishable from a slow one -- react-query's `mutate` swallows
// rejections by design, nothing in the app reads `.error`, and there are no toasts.
//
// A successful delete used to trust the optimistic removal and stop there. The
// observer node trails the validator and answers successfully with the record still
// present, so any later refetch could resurrect a deleted row -- the same
// stale-but-successful read that hid newly created records until creation was
// hardened against it. Deletion never was.

// Must be prefixed `mock` to be visible inside a hoisted jest.mock factory.
const mockAlert = jest.fn();
let mockDelete: (id: string) => Promise<{ waitForFinalization: Promise<void> }>;

jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useAlert: () => mockAlert,
  useConfirm: () => jest.fn(),
}));

jest.mock("@/lib/providers/wallet/useApi", () => ({
  useApi: () => ({
    agents: { delete: async (id: string) => mockDelete(id) },
    wallets: { address: "wallet-1" },
  }),
}));

/** A chain write never resolves synchronously; the fakes should not either. */
const TICK = Promise.resolve();

const LIST_KEY = ["agents", "wallet-1"] as const;

type Agents = { agents: { id: string; name: string }[] };

type DeleteAgent = UseMutationResult<
  { waitForFinalization: Promise<void> },
  unknown,
  string
>;

/**
 * The mutation as the dashboard gets it, without a DOM.
 *
 * Rendering to markup runs the hook and hands back the observer; the mutation is then
 * driven from the test. This keeps the suite in the node environment, which matters
 * because importing the query layer pulls in the client SDK's WASM, and that fetches
 * its binary at import time -- something jsdom's global object has no `fetch` for.
 */
function mountDeleteAgent(client: QueryClient) {
  // A holder rather than a bare `let`: TypeScript does not track assignments made
  // inside a closure, so a `let` would narrow to `never` at the null check below.
  const captured: { mutation: DeleteAgent | null } = { mutation: null };

  const Probe = () => {
    // The probe exists solely to hand the hook's result back out of the render;
    // with no DOM there is nowhere else to read it from.
    // eslint-disable-next-line react-hooks/immutability
    captured.mutation = useDeleteAgentMutation() as unknown as DeleteAgent;
    return null;
  };

  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );

  if (captured.mutation === null) {
    throw new Error("the probe never rendered");
  }
  return captured.mutation;
}

const setup = (
  agents: Agents["agents"],
  queryFn?: () => Agents,
): {
  client: QueryClient;
  deleteAgent: ReturnType<typeof mountDeleteAgent>;
} => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  // Before `setQueryData`: a query captures its options when it is created, so
  // defaults registered afterwards would never reach it and the refetch would be a
  // silent no-op -- which would make the reconciliation tests pass vacuously.
  if (queryFn) {
    client.setQueryDefaults(LIST_KEY, { queryFn });
  }
  client.setQueryData<Agents>(LIST_KEY, { agents });

  return { client, deleteAgent: mountDeleteAgent(client) };
};

const listedIds = (client: QueryClient) =>
  (client.getQueryData<Agents>(LIST_KEY)?.agents ?? []).map(
    (agent) => agent.id,
  );

beforeEach(() => {
  mockAlert.mockReset();
  mockAlert.mockResolvedValue(undefined);
});

describe("a delete that fails", () => {
  beforeEach(() => {
    mockDelete = async () => {
      await TICK;
      throw new Error("insufficient phlo");
    };
  });

  it("puts the row back", async () => {
    const { client, deleteAgent } = setup([
      { id: "a", name: "Refine" },
      { id: "b", name: "Condense" },
    ]);

    await expect(deleteAgent.mutateAsync("a")).rejects.toThrow();

    expect(listedIds(client)).toEqual(["a", "b"]);
  });

  it("says why, rather than letting the row silently reappear", async () => {
    const { deleteAgent } = setup([{ id: "a", name: "Refine" }]);

    await expect(deleteAgent.mutateAsync("a")).rejects.toThrow();

    expect(mockAlert).toHaveBeenCalledTimes(1);
    const [{ message, title }] = mockAlert.mock.calls[0] as [
      { message: string; title: string },
    ];
    expect(title).toContain("Delete failed");
    // The chain's own reason, not merely "something went wrong": it is the only
    // thing that tells the user whether to retry or to fund the wallet.
    expect(message).toContain("insufficient phlo");
  });
});

describe("a delete that succeeds", () => {
  it("waits for the write to finalize before reconciling", async () => {
    // Refetching before finalization reads the pre-delete state and puts the row
    // straight back, which is worse than not refetching at all.
    let finalized = false;
    let readsBeforeFinalization = 0;
    mockDelete = async () => {
      await TICK;
      return {
        waitForFinalization: new Promise<void>((resolve) => {
          setTimeout(() => {
            finalized = true;
            resolve();
          }, 20);
        }),
      };
    };

    let reads = 0;
    const { client, deleteAgent } = setup([{ id: "a", name: "Refine" }], () => {
      reads += 1;
      if (!finalized) {
        readsBeforeFinalization += 1;
      }
      return { agents: [] };
    });

    await deleteAgent.mutateAsync("a");

    expect(reads).toBeGreaterThan(0);
    expect(readsBeforeFinalization).toBe(0);
    expect(listedIds(client)).toEqual([]);
  });

  it("keeps refetching while the observer still returns the deleted row", async () => {
    // The resurrection this closes: the first read after the write is successful and
    // stale, and caching it leaves the row on screen with nothing to dislodge it.
    mockDelete = async () => {
      await TICK;
      return { waitForFinalization: TICK };
    };

    let reads = 0;
    const { client, deleteAgent } = setup([{ id: "a", name: "Refine" }], () => {
      reads += 1;
      return { agents: reads <= 1 ? [{ id: "a", name: "Refine" }] : [] };
    });

    await deleteAgent.mutateAsync("a");

    expect(reads).toBeGreaterThan(1);
    expect(listedIds(client)).toEqual([]);
  });

  it("reports nothing when it works", async () => {
    // The dialog has to mean something when it does appear.
    mockDelete = async () => {
      await TICK;
      return { waitForFinalization: TICK };
    };

    const { deleteAgent } = setup([{ id: "a", name: "Refine" }], () => ({
      agents: [],
    }));

    await deleteAgent.mutateAsync("a");

    expect(mockAlert).not.toHaveBeenCalled();
  });
});
