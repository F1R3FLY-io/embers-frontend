import { Navigate } from "react-router-dom";

import { useWalletState } from "@/lib/providers/wallet/useApi";

export default function Home() {
  const state = useWalletState();

  if (state.ready) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to="/dashboard" />;
}
