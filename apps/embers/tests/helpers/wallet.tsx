/* eslint-disable react-refresh/only-export-components -- a test helper is
   never hot-reloaded, and these wallet fixtures belong beside the provider
   they configure rather than in a file of their own. */
import type { EmbersApiSdk, PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import type { PropsWithChildren } from "react";

import type { WalletStateContext } from "@/lib/providers/wallet/useApi";

import { WalletContext } from "@/lib/providers/wallet/useApi";

/**
 * A signed-in wallet, without signing in.
 *
 * `WalletProvider` builds a real `EmbersApiSdk` from a private key, which drags
 * the SDK's import-time WASM and a live WebSocket into any test that renders it.
 * Supplying the context directly is both faster and more precise: the test says
 * what the wallet is instead of arranging for it.
 *
 * Pass whatever the code under test actually reaches for. Most components read
 * only `ready`, so the default placeholder SDK is never dereferenced; a
 * component that calls `api.agents.delete` gets a stub with just that method.
 * The cast is deliberate -- a full `EmbersApiSdk` cannot be constructed without
 * a key, and building one would test the SDK rather than the component.
 */
export function readyWallet(
  embers: Partial<EmbersApiSdk> = {},
  setKey: (key?: PrivateKey) => void = () => {},
): WalletStateContext {
  return { embers: embers as EmbersApiSdk, ready: true, setKey };
}

/** A wallet that has not been signed in: what every route guard should turn away. */
export function signedOutWallet(
  setKey: (key?: PrivateKey) => void = () => {},
): WalletStateContext {
  return { ready: false, setKey };
}

export function TestWalletProvider({
  children,
  wallet,
}: PropsWithChildren<{ wallet: WalletStateContext }>) {
  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
}
