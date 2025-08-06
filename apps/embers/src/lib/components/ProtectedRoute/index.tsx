import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useWallet } from "@/lib/providers/wallet/useWallet";

export default function ProtectedRoute() {
  const { wallet } = useWallet();
  const location = useLocation();

  if (!wallet) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
