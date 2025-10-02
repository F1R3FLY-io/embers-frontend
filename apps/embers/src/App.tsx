import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/lib/components/ProtectedRoute";
import { LayoutProvider } from "@/lib/providers/layout/LayoutProvider";
import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import { StepperProvider } from "@/lib/providers/stepper/StepperProvider";
import { ThemeProvider } from "@/lib/providers/theme/ThemeProvider";
import { WalletProvider } from "@/lib/providers/wallet/WalletProvider";

import styles from "./App.module.scss";
import "./index.scss";

const Dashboard = lazy(async () => import("@/pages/Dashboard"));
const CreateAgent = lazy(async () => import("@/pages/CreateAgent"));
const Deploy = lazy(async () => import("@/pages/Deploy"));
const Home = lazy(async () => import("@/pages/Home"));
const Login = lazy(async () => import("@/pages/Login"));
const CreateAiTeamFlow = lazy(async () => import("@/pages/CreateAiTeamFlow"));
const EditAgent = lazy(async () => import("@/pages/EditAgent"));

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ThemeProvider>
          <LayoutProvider>
            <ReactFlowProvider>
              <ModalProvider>
                <StepperProvider>
                  <BrowserRouter>
                    <div className={styles.background}>
                      <Routes>
                        <Route element={<Home />} path="/" />
                        <Route element={<Login />} path="/login" />
                        <Route element={<ProtectedRoute />}>
                          <Route
                            element={<CreateAgent />}
                            path="/create-ai-agent/create"
                          />
                          <Route
                            element={<CreateAiTeamFlow />}
                            path="/create-ai-team"
                          />
                          <Route
                            element={<Deploy />}
                            path="/create-ai-agent/deploy"
                          />
                          <Route element={<Dashboard />} path="/dashboard" />
                          <Route
                            element={<EditAgent />}
                            path="/create-ai-agent"
                          />
                        </Route>
                      </Routes>
                    </div>
                  </BrowserRouter>
                </StepperProvider>
              </ModalProvider>
            </ReactFlowProvider>
          </LayoutProvider>
        </ThemeProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
