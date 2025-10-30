import type { PrivateKey } from "@f1r3fly-io/embers-client-sdk";

import { EmbersApiSdk } from "@f1r3fly-io/embers-client-sdk";
import { useReducer } from "react";

import { WalletContext } from "./useApi";

const FIREFLY_API_URL = window.API_URL;

export function WalletProvider({ children }: React.PropsWithChildren) {
  const [embers, dispatch] = useReducer<
    EmbersApiSdk | undefined,
    [PrivateKey | undefined]
  >(
    (_, privateKey) =>
      privateKey &&
      new EmbersApiSdk({
        basePath: FIREFLY_API_URL,
        privateKey,
      }),
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
