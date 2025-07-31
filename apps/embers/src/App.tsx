import "./index.scss";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/lib/components/ProtectedRoute";
import { WalletProvider } from "@/lib/providers/wallet/WalletProvider";

import styles from "./App.module.scss";

const Create = lazy(async () => import("@/pages/Create"));
const Edit = lazy(async () => import("@/pages/Edit"));
const Home = lazy(async () => import("@/pages/Home"));
const Login = lazy(async () => import("@/pages/Login"));

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
                <Route element={<Create />} path="/create" />
                <Route element={<Edit />} path="/edit" />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </WalletProvider>
    </QueryClientProvider>
  );
}
