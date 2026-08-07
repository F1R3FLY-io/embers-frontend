/**
 * @jest-environment jest-fixed-jsdom
 */
import type { PropsWithChildren } from "react";

import { act, renderHook } from "@testing-library/react";

import { installMockWebSocket } from "./helpers/mockWebSocket";

// `window.API_URL` is read at MODULE SCOPE by WalletProvider, so it has to be
// in place before the import below rather than in a beforeEach.
(window as unknown as { API_URL: string }).API_URL = "http://embers.test";

import { PrivateKey } from "@f1r3fly-io/embers-client-sdk";

import { useApi, useWalletState } from "@/lib/providers/wallet/useApi";
import { WalletProvider } from "@/lib/providers/wallet/WalletProvider";

// Signing in, signing out, and what the rest of the app is allowed to assume.
//
// This provider is the app's whole notion of identity: it turns a private key
// into an SDK, and `useApi` is what every query and mutation calls to get it.
// It had no tests. The guard in `useApi` is the interesting part -- it throws
// rather than returning undefined, which is what stops a signed-out render
// from reaching the network with no key and failing somewhere far away.

const TEST_KEY =
  "0b4e1234567890abcdef0b4e1234567890abcdef0b4e1234567890abcdef0b4e";
const OTHER_KEY =
  "1c5f00000000000000000000000000000000000000000000000000000000abcd";

let restoreWebSocket: () => void;

beforeEach(() => {
  // Constructing the SDK opens the finalization socket immediately.
  restoreWebSocket = installMockWebSocket();
});

afterEach(() => {
  restoreWebSocket();
});

function Wrapper({ children }: PropsWithChildren) {
  return <WalletProvider>{children}</WalletProvider>;
}

describe("before a key is supplied", () => {
  it("reports itself as not ready", () => {
    const { result } = renderHook(() => useWalletState(), { wrapper: Wrapper });

    expect(result.current.ready).toBe(false);
  });

  it("refuses to hand out an SDK, loudly", () => {
    // Throwing rather than returning undefined is deliberate: a component that
    // read `undefined` here would fail later, inside a request, with an error
    // that says nothing about the wallet. This fails at the point the mistake
    // was made.
    expect(() => renderHook(() => useApi(), { wrapper: Wrapper })).toThrow(
      /wallet not ready/i,
    );
  });
});

describe("after signing in", () => {
  it("becomes ready and exposes an SDK addressed to the key", () => {
    const { result } = renderHook(() => useWalletState(), { wrapper: Wrapper });

    act(() => {
      result.current.setKey(PrivateKey.tryFromHex(TEST_KEY));
    });

    expect(result.current.ready).toBe(true);
    const state = result.current;
    if (!state.ready) {
      throw new Error("the wallet did not become ready");
    }
    // The address is derived from the key rather than supplied, so this also
    // pins that the SDK was built from the key that was handed in.
    expect(String(state.embers.wallets.address)).toMatch(/^1111/);
  });

  it("opens exactly one finalization stream for the wallet", () => {
    const { result } = renderHook(() => useWalletState(), { wrapper: Wrapper });

    act(() => {
      result.current.setKey(PrivateKey.tryFromHex(TEST_KEY));
    });

    // Signing in is what opens the socket; a second one would mean a leaked
    // SDK from a previous key still listening.
    const sockets = installedSockets();
    expect(sockets).toHaveLength(1);
    expect(sockets[0]).toContain("http://embers.test");
    expect(sockets[0]).toContain("/deploys");
  });
});

describe("the socket of a wallet no longer in use", () => {
  it("is closed when a different key replaces it", () => {
    const { result } = renderHook(() => useWalletState(), { wrapper: Wrapper });

    act(() => {
      result.current.setKey(PrivateKey.tryFromHex(TEST_KEY));
    });
    const first = latestSocket();

    act(() => {
      result.current.setKey(PrivateKey.tryFromHex(OTHER_KEY));
    });

    // Constructing an SDK opens a socket that reconnects on every close, so an
    // abandoned one does not go quiet: it keeps a connection to the previous
    // wallet's deploy stream alive indefinitely.
    expect(first.closed).toBe(true);
    expect(latestSocket().closed).toBe(false);
  });

  it("is closed on sign-out", () => {
    const { result } = renderHook(() => useWalletState(), { wrapper: Wrapper });

    act(() => {
      result.current.setKey(PrivateKey.tryFromHex(TEST_KEY));
    });
    const socket = latestSocket();

    act(() => {
      result.current.setKey();
    });

    // A signed-out wallet must not still be listening to its own deploys.
    expect(socket.closed).toBe(true);
  });

  it("leaves only one live socket after signing in, out, and in again", () => {
    const { result } = renderHook(() => useWalletState(), { wrapper: Wrapper });

    act(() => {
      result.current.setKey(PrivateKey.tryFromHex(TEST_KEY));
    });
    act(() => {
      result.current.setKey();
    });
    act(() => {
      result.current.setKey(PrivateKey.tryFromHex(OTHER_KEY));
    });

    // Three sockets were constructed across the cycle; exactly one is still
    // open. Without the cleanup every sign-in added one that never stopped.
    expect(sockets().filter((socket) => !socket.closed)).toHaveLength(1);
  });
});

describe("signing out", () => {
  it("returns to not ready when the key is cleared", () => {
    const { result } = renderHook(() => useWalletState(), { wrapper: Wrapper });

    act(() => {
      result.current.setKey(PrivateKey.tryFromHex(TEST_KEY));
    });
    expect(result.current.ready).toBe(true);

    act(() => {
      result.current.setKey();
    });

    // Logout calls setKey with no argument; the provider must treat that as
    // "no wallet" rather than as a key it cannot use.
    expect(result.current.ready).toBe(false);
  });

  it("makes useApi throw again once signed out", () => {
    const { result } = renderHook(() => ({ state: useWalletState() }), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.state.setKey(PrivateKey.tryFromHex(TEST_KEY));
    });
    act(() => {
      result.current.state.setKey();
    });

    expect(() => renderHook(() => useApi(), { wrapper: Wrapper })).toThrow();
  });
});

interface TrackedSocket {
  closed: boolean;
  url: string;
}

/** Every WebSocket constructed since the mock was installed. */
function sockets(): TrackedSocket[] {
  const constructor = (globalThis as { WebSocket?: unknown }).WebSocket as {
    instances?: TrackedSocket[];
  };
  return constructor.instances ?? [];
}

function latestSocket(): TrackedSocket {
  const socket = sockets().at(-1);
  if (socket === undefined) {
    throw new Error("no WebSocket was constructed");
  }
  return socket;
}

/** URLs of every WebSocket constructed since the mock was installed. */
function installedSockets(): string[] {
  return sockets().map((socket) => socket.url);
}
