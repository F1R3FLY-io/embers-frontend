import type {
  AgentsTeamsApiSdk,
  CreateAgentReq,
  PrivateKey,
} from "@f1r3fly-io/embers-client-sdk";

import { AIAgentsTeamsApi } from "@f1r3fly-io/embers-client-sdk";
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

export function useAgent(id: string, version: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agents.getAgentVersion(id, version),
    queryKey: ["agents", api.wallets.address, id, version],
  });
}

export function useTestKey() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agents.getTestWalletKey(),
    queryKey: ["agents", "test-key"],
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
    }) => api.agents.testDeployAgent(testKey, test, env),
  });
}

export function useDeployDemo() {
  const client = new AIAgentsTeamsApi({
    basePath: import.meta.env.VITE_FIREFLY_API_URL as string,
  });

  return useMutation({
    mutationFn: async (name: string) =>
      client.apiAiAgentsTeamsDeployDemoPost({ deployDemoReq: { name } }),
  });
}

export function useRunDemo() {
  const client = new AIAgentsTeamsApi({
    basePath: import.meta.env.VITE_FIREFLY_API_URL as string,
  });

  return useMutation({
    mutationFn: async (props: {
      name: string;
      prompt: string;
    }): Promise<unknown> =>
      client.apiAiAgentsTeamsRunDemoPost({
        runDemoReq: props,
      }),
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const graph = toApiGraph(nodes, edges);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const graph = toApiGraph(nodes, edges);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return api.agentsTeams.saveAgentsTeamVersion(id, { ...rest, graph });
    },
  });
}
