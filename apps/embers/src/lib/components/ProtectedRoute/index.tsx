import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useWalletState } from "@/lib/providers/wallet/useApi";

export default function ProtectedRoute() {
  const { ready } = useWalletState();
  const location = useLocation();

  if (!ready) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
