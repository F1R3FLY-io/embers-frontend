import type { CreateAgentReq, PrivateKey } from "@f1r3fly-io/embers-client-sdk";

import { AIAgentsTeamsApi, Configuration } from "@f1r3fly-io/embers-client-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useApi } from "@/lib/providers/wallet/useApi";

export function useAgents() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.aiAgent.getAgents(),
    queryKey: ["ai-agents", api.wallet.address],
  });
}

export function useAgentVersions(id: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.aiAgent.getAgentVersions(id),
    queryKey: ["ai-agents", api.wallet.address, id],
  });
}

export function useAgent(id: string, version: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.aiAgent.getAgentVersion(id, version),
    queryKey: ["ai-agents", api.wallet.address, id, version],
  });
}

export function useTestKey() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.aiAgent.getTestWalletKey(),
    queryKey: ["ai-agents", "test-key"],
  });
}

export function useCreateAgentMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentReq) =>
      api.aiAgent.createAgent(params),
  });
}

export function useSaveAgentMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentReq) =>
      api.aiAgent.saveAgentVersion(id, params),
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
    }) => api.aiAgent.testDeployAgent(testKey, test, env),
  });
}

export function useDeployDemo() {
  const configuration = new Configuration({
    basePath: import.meta.env.VITE_FIREFLY_API_URL as string,
  });
  const client = new AIAgentsTeamsApi(configuration);

  return useMutation({
    mutationFn: async (name: string) =>
      client.apiAiAgentsTeamsDeployDemoPost({ deployDemoReq: { name } }),
  });
}

export function useRunDemo() {
  const configuration = new Configuration({
    basePath: import.meta.env.VITE_FIREFLY_API_URL as string,
  });
  const client = new AIAgentsTeamsApi(configuration);

  return useMutation({
    mutationFn: async (props: { name: string; prompt: string }) =>
      client.apiAiAgentsTeamsRunDemoPost({
        runDemoReq: props,
      }) as Promise<unknown>,
  });
}
