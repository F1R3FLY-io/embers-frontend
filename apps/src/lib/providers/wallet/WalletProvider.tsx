import type { PrivateKey } from "@f1r3fly-io/embers-client-sdk";

import {
  AgentsApiSdk,
  AgentsTeamsApiSdk,
  WalletsApiSdk,
} from "@f1r3fly-io/embers-client-sdk";
import { useReducer } from "react";

import type { EmbersAPI } from "./useApi";

import { WalletContext } from "./useApi";

const FIREFLY_API_URL = import.meta.env.VITE_FIREFLY_API_URL as string;

export function WalletProvider({ children }: React.PropsWithChildren) {
  const [embers, dispatch] = useReducer<
    EmbersAPI | undefined,
    [PrivateKey | undefined]
  >(
    (_, privateKey) =>
      privateKey && {
        agents: new AgentsApiSdk({
          basePath: FIREFLY_API_URL,
          privateKey,
        }),
        agentsTeams: new AgentsTeamsApiSdk({
          basePath: FIREFLY_API_URL,
          privateKey,
        }),
        wallets: new WalletsApiSdk({
          basePath: FIREFLY_API_URL,
          privateKey,
        }),
      },
    undefined,
  );

  return (
    <WalletContext.Provider
      value={
        embers === undefined
          ? {
              ready: false,
              setKey: dispatch,
            }
          : {
              embers,
              ready: true,
              setKey: dispatch,
            }
      }
    >
      {children}
    </WalletContext.Provider>
  );
}
