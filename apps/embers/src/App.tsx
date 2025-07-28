import "./index.scss";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/lib/components/ProtectedRoute";
import { WalletProvider } from "@/lib/providers/wallet/WalletProvider";
import { CreateDashboard } from "@/pages/CreateDashboard";
import Edit from "@/pages/Edit";
import Home from "@/pages/Home";
import { Login } from "@/pages/Login";

import styles from "./App.module.scss";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <BrowserRouter>
          <div className={styles.background}>
            <Routes>
              <Route element={<Home />} path="/" />
              <Route element={<Login />} path="/login" />
              <Route element={<ProtectedRoute />}>
                <Route element={<CreateDashboard />} path="/create" />
                <Route element={<Edit />} path="/edit" />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </WalletProvider>
    </QueryClientProvider>
  );
}
