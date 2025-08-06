import { Navigate } from "react-router-dom";

import { useWallet } from "@/lib/providers/wallet/useWallet";

export default function Home() {
  const { wallet } = useWallet();

  if (!wallet) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to="/dashboard" />;
}
