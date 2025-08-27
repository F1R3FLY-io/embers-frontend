import type {
  CreateAgentReq,
  CreateAgentsTeamReq,
  PrivateKey,
} from "@f1r3fly-io/embers-client-sdk";

import { AIAgentsTeamsApi } from "@f1r3fly-io/embers-client-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useApi } from "@/lib/providers/wallet/useApi";

export function useAgents() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agents.getAgents() as Promise<unknown>,
    queryKey: ["agents", api.wallets.address],
  });
}

export function useAgentVersions(id: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agents.getAgentVersions(id) as Promise<unknown>,
    queryKey: ["agents", api.wallets.address, id],
  });
}

export function useAgent(id: string, version: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () =>
      api.agents.getAgentVersion(id, version) as Promise<unknown>,
    queryKey: ["agents", api.wallets.address, id, version],
  });
}

export function useTestKey() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agents.getTestWalletKey() as Promise<unknown>,
    queryKey: ["agents", "test-key"],
  });
}

export function useCreateAgentMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentReq) =>
      api.agents.createAgent(params) as Promise<unknown>,
  });
}

export function useSaveAgentMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentReq) =>
      api.agents.saveAgentVersion(id, params) as Promise<unknown>,
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
    }) => api.agents.testDeployAgent(testKey, test, env) as Promise<unknown>,
  });
}

export function useDeployDemo() {
  const configuration = {
    basePath: import.meta.env.VITE_FIREFLY_API_URL as string,
  };
  const client = new AIAgentsTeamsApi(configuration);

  return useMutation({
    mutationFn: async (name: string) =>
      client.apiAiAgentsTeamsDeployDemoPost({
        deployDemoReq: { name },
      }) as Promise<unknown>,
  });
}

export function useRunDemo() {
  const configuration = {
    basePath: import.meta.env.VITE_FIREFLY_API_URL as string,
  };
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
    queryFn: async () => api.agentsTeams.getAgentsTeams() as Promise<unknown>,
    queryKey: ["agents-teams", api.wallets.address],
  });
}

export function useAgentsTeamVersions(id: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () =>
      api.agentsTeams.getAgentsTeamVersions(id) as Promise<unknown>,
    queryKey: ["agents-teams", api.wallets.address, id],
  });
}

export function useAgentsTeam(id: string, version: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () =>
      api.agentsTeams.getAgentsTeamVersion(id, version) as Promise<unknown>,
    queryKey: ["agents-teams", api.wallets.address, id, version],
  });
}

export function useCreateAgentsTeamMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentsTeamReq) =>
      api.agentsTeams.createAgentsTeam(params) as Promise<unknown>,
  });
}

export function useSaveAgentsTeamMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentsTeamReq) =>
      api.agentsTeams.saveAgentsTeamVersion(id, params) as Promise<unknown>,
  });
}
