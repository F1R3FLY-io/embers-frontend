import type { PrivateKey } from "@f1r3fly-io/embers-client-sdk";

import { createContext, useContext } from "react";

export type Wallet = {
  privateKey: PrivateKey;
};

export type WalletStateContext =
  | {
      ready: false;
      setWallet: (wallet?: Wallet) => void;
    }
  | {
      ready: true;
      setWallet: (wallet?: Wallet) => void;
      wallet: Wallet;
    };

export const WalletContext = createContext<WalletStateContext>({
  ready: false,
  setWallet: () => {},
});

export function useWalletState() {
  return useContext(WalletContext);
}

export function useWallet(): Wallet {
  const state = useContext(WalletContext);
  if (!state.ready) {
    throw Error("wallet not ready");
  }
  return state.wallet;
}
