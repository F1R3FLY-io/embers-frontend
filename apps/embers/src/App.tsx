import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/lib/components/ProtectedRoute";
import { ThemeProvider } from "@/lib/providers/theme/ThemeProvider";
import { WalletProvider } from "@/lib/providers/wallet/WalletProvider";

import styles from "./App.module.scss";
import "./index.scss";

const Dashboard = lazy(async () => import("@/pages/Dashboard"));
const Edit = lazy(async () => import("@/pages/Edit"));
const Home = lazy(async () => import("@/pages/Home"));
const Login = lazy(async () => import("@/pages/Login"));
const GraphEditor = lazy(async () => import("@/lib/components/GraphEditor"));

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ThemeProvider>
          <ReactFlowProvider>
            <BrowserRouter>
              <div className={styles.background}>
                <Routes>
                  <Route element={<Home />} path="/" />
                  <Route element={<Login />} path="/login" />
                  {/* until full page is ready */}
                  <Route element={<GraphEditor />} path="/editor" />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<Dashboard />} path="/dashboard" />
                    <Route element={<Edit />} path="/edit" />
                  </Route>
                </Routes>
              </div>
            </BrowserRouter>
          </ReactFlowProvider>
        </ThemeProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
