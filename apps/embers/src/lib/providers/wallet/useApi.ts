import type { EmbersApiSdk, PrivateKey } from "@f1r3fly-io/embers-client-sdk";

import { createContext, useContext } from "react";

export type WalletStateContext =
  | {
      ready: false;
      setKey: (key?: PrivateKey) => void;
    }
  | {
      embers: EmbersApiSdk;
      ready: true;
      setKey: (key?: PrivateKey) => void;
    };

export const WalletContext = createContext<WalletStateContext>({
  ready: false,
  setKey: () => {},
});

export function useWalletState() {
  return useContext(WalletContext);
}

export function useApi() {
  const state = useContext(WalletContext);
  if (!state.ready) {
    throw Error("wallet not ready");
  }
  return state.embers;
}
