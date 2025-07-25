import { useState } from "react";

import { type Wallet, WalletContext } from "./useWallet";

export function WalletProvider({ children }: React.PropsWithChildren) {
  const [wallet, setWallet] = useState<Wallet>();

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
