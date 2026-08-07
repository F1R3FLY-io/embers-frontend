/**
 * @jest-environment jest-fixed-jsdom
 */
// jsdom implements no `Response`, `Request`, or `fetch`, so a suite that lets
// the real SDK issue a request fails inside the generated client rather than in
// anything under test. jest-fixed-jsdom is jsdom plus those Node globals -- the
// same DOM, with the web platform pieces jsdom omits.
import type { PropsWithChildren } from "react";

import { EmbersApiSdk, PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";

import { LoaderProvider } from "@/lib/providers/loader/LoaderProvider";
import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import { WalletContext } from "@/lib/providers/wallet/useApi";
import {
  useAgents,
  useCreateAgentMutation,
  useDeleteAgentMutation,
} from "@/lib/queries";

import {
  deployIdFromSignature,
  fakeAgentsBackend,
} from "./helpers/fakeBackend";
import {
  installMockWebSocket,
  latestWebSocket,
  observerEvent,
} from "./helpers/mockWebSocket";
import { installModalRoot } from "./helpers/modalRoot";
import { makeTestQueryClient } from "./helpers/queryClient";

// What the query layer does AFTER a write, exercised against the real SDK.
//
// Every other suite in this directory mocks `@/lib/queries`, so it can show
// only that a component calls a hook. What the hook then does with the answer
// -- poll the list until the new record is visible, roll an optimistic delete
// back when the chain rejects it -- is the part that has actually broken
// before (ae78b40, 6ebaa9c), and mocking the module hides all of it. These run
// the real hook, the real SDK, real signing, and a real finalization event.

const TEST_KEY =
  "0b4e1234567890abcdef0b4e1234567890abcdef0b4e1234567890abcdef0b4e";

let restoreWebSocket: () => void;

beforeEach(() => {
  restoreWebSocket = installMockWebSocket();
});

afterEach(() => {
  restoreWebSocket();
});

function makeHarness(backend: ReturnType<typeof fakeAgentsBackend>) {
  const sdk = new EmbersApiSdk({
    basePath: "http://embers.test",
    fetchApi: backend.fetchApi as never,
    privateKey: PrivateKey.tryFromHex(TEST_KEY),
  });
  const client = makeTestQueryClient();
  // The delete mutation reports failures through `useFailureReporter`, which
  // opens a modal, so the modal and loader providers are part of the contract
  // rather than decoration.
  installModalRoot();
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <WalletContext.Provider
        value={{ embers: sdk, ready: true, setKey: () => {} }}
      >
        <LoaderProvider>
          <ModalProvider>{children}</ModalProvider>
        </LoaderProvider>
      </WalletContext.Provider>
    </QueryClientProvider>
  );
  return { client, sdk, Wrapper };
}

/** Delivers the finalization frame the SDK is actually waiting on. */
async function finalizeLastSend(backend: { lastSignature: string }) {
  await waitFor(() => {
    expect(backend.lastSignature).not.toBe("");
  });
  act(() => {
    latestWebSocket().onmessage?.({
      data: observerEvent(deployIdFromSignature(backend.lastSignature)),
    });
  });
}

it("keeps polling the list until a newly created agent is visible", async () => {
  const backend = fakeAgentsBackend();
  // The write is accepted immediately, but the next two list reads still serve
  // the pre-write view: an observer node trailing the validator.
  backend.staleReads = 2;

  const { Wrapper } = makeHarness(backend);
  const { result } = renderHook(
    () => ({ create: useCreateAgentMutation(), list: useAgents() }),
    { wrapper: Wrapper },
  );

  await waitFor(() => {
    expect(result.current.list.data?.agents).toHaveLength(0);
  });

  await act(async () => {
    await result.current.create.mutateAsync({
      code: "new x in { Nil }",
      name: "Researcher",
    } as never);
  });
  await finalizeLastSend(backend);

  // Only a later read shows the record. Without the polling loop the dashboard
  // would sit on an empty list until the user refreshed by hand.
  await waitFor(
    () => {
      expect(result.current.list.data?.agents).toHaveLength(1);
    },
    { timeout: 15_000 },
  );
  expect(
    backend.calls.filter((call) => call === "list").length,
  ).toBeGreaterThan(1);
}, 30_000);

it("restores a deleted row when the chain rejects the delete", async () => {
  const backend = fakeAgentsBackend([
    { id: "agent-1", name: "Researcher", version: "v1" },
  ]);
  backend.failSend = { description: "delete rejected", status: 400 };

  const { Wrapper } = makeHarness(backend);
  const { result } = renderHook(
    () => ({ list: useAgents(), remove: useDeleteAgentMutation() }),
    { wrapper: Wrapper },
  );

  await waitFor(() => {
    expect(result.current.list.data?.agents).toHaveLength(1);
  });

  await act(async () => {
    await result.current.remove.mutateAsync("agent-1").catch(() => undefined);
  });

  // The optimistic removal has to be undone. Without the rollback the row
  // vanishes for a delete that never happened, then reappears on some later
  // refetch with nothing to explain either event.
  await waitFor(() => {
    expect(result.current.list.data?.agents).toHaveLength(1);
  });
}, 30_000);

it("keeps a deleted row gone while the list still reports it", async () => {
  const backend = fakeAgentsBackend([
    { id: "agent-1", name: "Researcher", version: "v1" },
  ]);
  // The delete succeeds but the next reads still show the record: the mirror
  // image of the create case, and why a deleted row used to come back.
  backend.staleReads = 2;

  const { Wrapper } = makeHarness(backend);
  const { result } = renderHook(
    () => ({ list: useAgents(), remove: useDeleteAgentMutation() }),
    { wrapper: Wrapper },
  );

  await waitFor(() => {
    expect(result.current.list.data?.agents).toHaveLength(1);
  });

  const removal = result.current.remove.mutateAsync("agent-1");
  await finalizeLastSend(backend);
  await act(async () => {
    await removal.catch(() => undefined);
  });

  await waitFor(
    () => {
      expect(result.current.list.data?.agents).toHaveLength(0);
    },
    { timeout: 15_000 },
  );
}, 30_000);
