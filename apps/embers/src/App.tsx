import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/lib/components/ProtectedRoute";
import { CurrentAgentProvider } from "@/lib/providers/currentAgent/CurrentAgentProvider";
import { DockProvider } from "@/lib/providers/dock/DockProvider";
import { LoaderProvider } from "@/lib/providers/loader/LoaderProvider";
import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import { GraphEditorStepperProvider } from "@/lib/providers/stepper/flows/GraphEditor";
import { OSLFEditorStepperProvider } from "@/lib/providers/stepper/flows/OSLFEditor";
import { ThemeProvider } from "@/lib/providers/theme/ThemeProvider";
import { WalletProvider } from "@/lib/providers/wallet/WalletProvider";

import styles from "./App.module.scss";
import "./index.scss";

const Dashboard = lazy(async () => import("@/pages/Dashboard"));
const CreateAgent = lazy(async () => import("@/pages/CreateAgent"));
const CreateOSLF = lazy(async () => import("@/pages/OSLF/create"));
const DeployOSLF = lazy(async () => import("@/pages/OSLF/deploy"));
const GraphOSLF = lazy(async () => import("@/pages/OSLF/graph"));
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
                              <CurrentAgentProvider>
                                <Routes>
                                  <Route
                                    element={<CreateAgent />}
                                    path="create"
                                  />
                                  <Route element={<EditAgent />} path="edit" />
                                  <Route
                                    element={<DeployAgent />}
                                    path="deploy"
                                  />
                                </Routes>
                              </CurrentAgentProvider>
                            }
                            path="/agent/*"
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
                                    path="edit"
                                  />
                                  <Route
                                    element={<DeployAgentsTeam />}
                                    path="deploy"
                                  />
                                </Routes>
                              </GraphEditorStepperProvider>
                            }
                            path="/agents-team/*"
                          />
                          <Route
                            element={
                                <OSLFEditorStepperProvider>
                                  <Routes>
                                    <Route
                                      element={<CreateOSLF />}
                                      path="create"
                                    />
                                    <Route element={<GraphOSLF />} path="" />
                                    <Route
                                      element={<DeployOSLF />}
                                      path="deploy"
                                    />
                                  </Routes>
                                </OSLFEditorStepperProvider>
                              }
                              path="/oslf/*"
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

            </DockProvider>
          </LoaderProvider>
        </ThemeProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
