import { useState } from "react";

import { WalletContext, type WalletDummy } from "./useWallet";

export function WalletProvider({ children }: React.PropsWithChildren) {
  const [wallet, setWallet] = useState<WalletDummy>();

  return (
    <WalletContext.Provider
      value={{
        setWallet,
        wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
