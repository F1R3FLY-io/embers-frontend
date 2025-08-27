import type {
  AgentsApiSdk,
  AgentsTeamsApiSdk,
  PrivateKey,
  WalletsApiSdk,
} from "@f1r3fly-io/embers-client-sdk";

import { createContext, useContext } from "react";

export type EmbersAPI = {
  agents: AgentsApiSdk;
  agentsTeams: AgentsTeamsApiSdk;
  wallets: WalletsApiSdk;
};

export type WalletStateContext =
  | {
      ready: false;
      setKey: (key?: PrivateKey) => void;
    }
  | {
      embers: EmbersAPI;
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

export function useApi(): EmbersAPI {
  const state = useContext(WalletContext);
  if (!state.ready) {
    throw Error("wallet not ready");
  }
  return state.embers;
}
