import { Navigate } from "react-router-dom";

import { useWalletState } from "@/lib/providers/wallet/useApi";

export default function Home() {
  const state = useWalletState();

  // A signed-in wallet belongs on the dashboard; anyone else has to sign in
  // first. Inverted, this sent every signed-in visitor to the login screen and
  // routed signed-out ones through /dashboard, where ProtectedRoute bounced
  // them back -- correct only by way of a guard meant for direct navigation.
  if (state.ready) {
    return <Navigate replace to="/dashboard" />;
  }

  return <Navigate replace to="/login" />;
}
