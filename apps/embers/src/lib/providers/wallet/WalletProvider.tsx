import type { PrivateKey } from "@f1r3fly-io/embers-client-sdk";

import { EmbersApiSdk } from "@f1r3fly-io/embers-client-sdk";
import { useEffect, useReducer, useRef } from "react";

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

  // Shut down the wallet we just stopped using.
  //
  // Constructing an SDK opens a finalization WebSocket, and that socket
  // reconnects on every close, so an abandoned SDK does not go quiet -- it
  // keeps a connection to the signed-out wallet's deploy stream alive
  // indefinitely. Signing out and back in left one running per sign-in.
  //
  // Only the REPLACED instance is closed, never the current one on unmount.
  // React's StrictMode mounts effects twice in development, and an unmount
  // cleanup would close the socket of an SDK that the remount does not
  // recreate (the reducer state survives), leaving a dead wallet in dev. A
  // genuine unmount of this provider is a full teardown of the app, where the
  // browser reclaims the socket anyway.
  const previous = useRef<EmbersApiSdk | undefined>(undefined);
  useEffect(() => {
    if (previous.current !== undefined && previous.current !== embers) {
      previous.current.events.close();
    }
    previous.current = embers;
  }, [embers]);

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
