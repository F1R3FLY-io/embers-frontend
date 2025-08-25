import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/lib/components/ProtectedRoute";
import { LayoutProvider } from "@/lib/providers/layout/LayoutProvider";
import { ThemeProvider } from "@/lib/providers/theme/ThemeProvider";
import { WalletProvider } from "@/lib/providers/wallet/WalletProvider";

import styles from "./App.module.scss";
import "./index.scss";

const Dashboard = lazy(async () => import("@/pages/Dashboard"));
const Home = lazy(async () => import("@/pages/Home"));
const Login = lazy(async () => import("@/pages/Login"));
const CreateAiTeamFlow = lazy(async () => import("@/pages/CreateAiTeamFlow"));
const CreateAiAgentFlow = lazy(async () => import("@/pages/CreateAiAgentFlow"));

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ThemeProvider>
          <LayoutProvider>
            <ReactFlowProvider>
              <BrowserRouter>
                <div className={styles.background}>
                  <Routes>
                    <Route element={<Home />} path="/" />
                    <Route element={<Login />} path="/login" />
                    <Route
                      element={<CreateAiTeamFlow />}
                      path="/create-ai-team"
                    />
                    <Route element={<ProtectedRoute />}>
                      <Route element={<Dashboard />} path="/dashboard" />
                      <Route
                        element={<CreateAiAgentFlow />}
                        path="/create-ai-agent"
                      />
                    </Route>
                  </Routes>
                </div>
              </BrowserRouter>
            </ReactFlowProvider>
          </LayoutProvider>
        </ThemeProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
