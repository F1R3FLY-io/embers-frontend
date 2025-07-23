import { createContext, useContext } from "react";

export type WalletDummy = null;

export type WalletStateContext = {
  setWallet: (wallet?: WalletDummy) => void;
  wallet: WalletDummy | undefined;
};

export const WalletContext = createContext<WalletStateContext>({
  setWallet: () => {},
  wallet: undefined,
});

export function useWallet() {
  return useContext(WalletContext);
}
