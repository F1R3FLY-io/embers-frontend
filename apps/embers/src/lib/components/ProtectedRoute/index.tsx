import { Navigate, Outlet } from "react-router-dom";

import { useWallet } from "@/lib/providers/wallet/useWallet";

export default function ProtectedRoute() {
  const { wallet } = useWallet();

  if (!wallet) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
