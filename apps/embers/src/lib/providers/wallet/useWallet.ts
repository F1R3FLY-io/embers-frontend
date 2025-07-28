import { type PrivateKey } from "embers-client-sdk";
import { createContext, useContext } from "react";

export type Wallet = {
  privateKey: PrivateKey;
};

export type WalletStateContext = {
  setWallet: (wallet?: Wallet) => void;
  wallet: Wallet | undefined;
};

export const WalletContext = createContext<WalletStateContext>({
  setWallet: () => {},
  wallet: undefined,
});

export function useWallet() {
  return useContext(WalletContext);
}
