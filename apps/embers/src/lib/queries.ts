import type {
  AgentsTeamsApiSdk,
  CreateAgentReq,
  PrivateKey,
} from "@f1r3fly-io/embers-client-sdk";

import {
  AIAgentsTeamsApi,
  Amount,
  Configuration,
} from "@f1r3fly-io/embers-client-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useApi } from "@/lib/providers/wallet/useApi";

import type { Edge, Node } from "./components/GraphEditor";

import { toApiGraph } from "./graph";

export function useAgents() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agents.getAgents(),
    queryKey: ["agents", api.wallets.address],
  });
}

export function useAgentVersions(id: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agents.getAgentVersions(id),
    queryKey: ["agents", api.wallets.address, id],
  });
}

export function useAgent(agentId?: string, versionId?: string) {
  const api = useApi();

  return useQuery({
    enabled: !!agentId && !!versionId,
    queryFn: async () => api.agents.getAgentVersion(agentId!, versionId!),
    queryKey: ["agents", api.wallets.address, agentId, versionId],

    retry: (failureCount, error: unknown) => {
      if (failureCount >= 30) {
        return false;
      }

      if (typeof error === "object" && error !== null && "response" in error) {
        const status = (error as { response?: { status?: number } }).response
          ?.status;
        if (status === 404) {
          return true;
        }
      }
      return false;
    },
    retryDelay: 2000,
  });
}

export function useCreateAgentMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentReq) =>
      api.agents.createAgent(params),
  });
}

export function useSaveAgentMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentReq) =>
      api.agents.saveAgentVersion(id, params),
  });
}

export function useDeployCodeMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: { code: string; rhoLimit: bigint }) =>
      api.agents.deployCode(params.code, Amount.tryFrom(params.rhoLimit)),
  });
}

export function useDeployAgentMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: {
      agentId: string;
      rhoLimit: bigint;
      version: string;
    }) =>
      api.agents.deployAgent(
        params.agentId,
        params.version,
        Amount.tryFrom(params.rhoLimit),
      ),
  });
}

export function useTestKey() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.testnet.getWallet(),
    queryKey: ["agents", "test-key"],
  });
}

export function useDeployTestMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async ({
      env,
      test,
      testKey,
    }: {
      env?: string;
      test: string;
      testKey: PrivateKey;
    }) => api.testnet.deploy(testKey, test, env),
  });
}

export function useRunDemo() {
  const configuration = new Configuration({
    basePath: window.API_URL,
  });
  const client = new AIAgentsTeamsApi(configuration);

  return useMutation({
    mutationFn: async (props: { name: string; prompt: string }) =>
      client.apiAiAgentsTeamsRunDemoPost({
        runDemoReq: props,
      }) as Promise<unknown>,
  });
}

export function useAgentsTeams() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agentsTeams.getAgentsTeams(),
    queryKey: ["agents-teams", api.wallets.address],
  });
}

export function useAgentsTeamVersions(id: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agentsTeams.getAgentsTeamVersions(id),
    queryKey: ["agents-teams", api.wallets.address, id],
  });
}

export function useAgentsTeam(id: string, version: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agentsTeams.getAgentsTeamVersion(id, version),
    queryKey: ["agents-teams", api.wallets.address, id, version],
  });
}

type WithGraph<T> = Omit<T, "graph"> & {
  edges: Edge[];
  nodes: Node[];
};

export function useCreateAgentsTeamMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async ({
      edges,
      nodes,
      ...rest
    }: WithGraph<Parameters<AgentsTeamsApiSdk["createAgentsTeam"]>[0]>) => {
      const graph = toApiGraph(nodes, edges);
      return api.agentsTeams.createAgentsTeam({ ...rest, graph });
    },
  });
}

export function useSaveAgentsTeamMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async ({
      edges,
      nodes,
      ...rest
    }: WithGraph<
      Parameters<AgentsTeamsApiSdk["saveAgentsTeamVersion"]>[1]
    >) => {
      const graph = toApiGraph(nodes, edges);
      return api.agentsTeams.saveAgentsTeamVersion(id, { ...rest, graph });
    },
  });
}

export function useDeployGraphMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: {
      edges: Edge[];
      nodes: Node[];
      rhoLimit: bigint;
    }) => {
      const graph = toApiGraph(params.nodes, params.edges);
      return api.agentsTeams.deployGraph(
        graph,
        Amount.tryFrom(params.rhoLimit),
      );
    },
  });
}

export function useDeployAgentsTeamMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: {
      agentsTeamId: string;
      rhoLimit: bigint;
      version: string;
    }) =>
      api.agentsTeams.deployAgetnsTeam(
        params.agentsTeamId,
        params.version,
        Amount.tryFrom(params.rhoLimit),
      ),
  });
}
