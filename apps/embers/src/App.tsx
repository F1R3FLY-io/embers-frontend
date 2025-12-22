import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/lib/components/ProtectedRoute";
import { DockProvider } from "@/lib/providers/dock/DockProvider";
import { LayoutProvider } from "@/lib/providers/layout/LayoutProvider";
import { LoaderProvider } from "@/lib/providers/loader/LoaderProvider";
import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import { CodeEditorStepperProvider } from "@/lib/providers/stepper/flows/CodeEditor";
import { GraphEditorStepperProvider } from "@/lib/providers/stepper/flows/GraphEditor";
import { ThemeProvider } from "@/lib/providers/theme/ThemeProvider";
import { WalletProvider } from "@/lib/providers/wallet/WalletProvider";

import styles from "./App.module.scss";
import "./index.scss";

const Dashboard = lazy(async () => import("@/pages/Dashboard"));
const CreateAgent = lazy(async () => import("@/pages/CreateAgent"));
const CreateAgentsTeam = lazy(async () => import("@/pages/CreateAgentsTeam"));
const DeployAgent = lazy(async () => import("@/pages/DeployAgent"));
const DeployAgentsTeam = lazy(async () => import("@/pages/DeployAgentsTeam"));
const Home = lazy(async () => import("@/pages/Home"));
const Login = lazy(async () => import("@/pages/Login"));
const CreateAgentsTeamFlow = lazy(
  async () => import("@/pages/CreateAgentsTeamFlow"),
);
const EditAgent = lazy(async () => import("@/pages/EditAgent"));
const PublishAgentsTeam = lazy(async () => import("@/pages/PublishAgentsTeam"));

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ThemeProvider>
          <LoaderProvider>
            <DockProvider>
              <LayoutProvider>
                <ReactFlowProvider>
                  <BrowserRouter>
                    <ModalProvider>
                      <div className={styles.background}>
                        <Routes>
                          <Route element={<Home />} path="/" />
                          <Route element={<Login />} path="/login" />
                          <Route element={<ProtectedRoute />}>
                            <Route element={<Dashboard />} path="/dashboard" />
                            <Route
                              element={
                                <CodeEditorStepperProvider>
                                  <Routes>
                                    <Route
                                      element={<CreateAgent />}
                                      path="create"
                                    />
                                    <Route element={<EditAgent />} path="" />
                                    <Route
                                      element={<DeployAgent />}
                                      path="deploy"
                                    />
                                  </Routes>
                                </CodeEditorStepperProvider>
                              }
                              path="/create-agent/*"
                            />
                            <Route
                              element={
                                <GraphEditorStepperProvider>
                                  <Routes>
                                    <Route
                                      element={<CreateAgentsTeam />}
                                      path="create"
                                    />
                                    <Route
                                      element={<CreateAgentsTeamFlow />}
                                      path=""
                                    />
                                    <Route
                                      element={<DeployAgentsTeam />}
                                      path="deploy"
                                    />
                                  </Routes>
                                </GraphEditorStepperProvider>
                              }
                              path="/create-agents-team/*"
                            />
                            <Route
                              element={<PublishAgentsTeam />}
                              path="/publish-agents-team"
                            />
                          </Route>
                        </Routes>
                      </div>
                    </ModalProvider>
                  </BrowserRouter>
                </ReactFlowProvider>
              </LayoutProvider>
            </DockProvider>
          </LoaderProvider>
        </ThemeProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
