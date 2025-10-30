import type {
  AgentsTeamsApiSdk,
  CreateAgentReq,
  PrivateKey,
} from "@f1r3fly-io/embers-client-sdk";

import { Amount } from "@f1r3fly-io/embers-client-sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Agent } from "@/pages/Dashboard/components/AgentsGrid/AgentsGrid";

import { useApi } from "@/lib/providers/wallet/useApi";

import type { Edge, Node } from "./components/GraphEditor";

import { toApiGraph } from "./graph";

interface AgentsResponse {
  agents: Agent[];
}
interface AgentContext {
  listKey: readonly [string, string];
  previous: AgentsResponse;
}

export function useAgents() {
  const api = useApi();
  const walletKey = String(api.wallets.address);

  return useQuery({
    queryFn: async () => api.agents.get(),
    queryKey: ["agents", walletKey] as const,
  });
}

export function useAgentVersions(id?: string) {
  const api = useApi();

  return useQuery({
    enabled: !!id,
    queryFn: async () => api.agents.getVersions(id!),
    queryKey: ["agents", api.wallets.address, id],
  });
}

export function useAgent(id?: string, version?: string) {
  const api = useApi();
  const walletKey = String(api.wallets.address);

  return useQuery({
    enabled: !!id && !!version,
    queryFn: async () => api.agents.getVersion(id!, version!),
    queryKey: ["agents", walletKey, id, version],
  });
}

export function useCreateAgentMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAgentReq) => api.agents.create(params),
    onSuccess: async () =>
      queryClient.invalidateQueries({
        exact: true,
        queryKey: ["agents", api.wallets.address],
      }),
  });
}

export function useSaveAgentMutation(id: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAgentReq) => api.agents.save(id, params),
    onSuccess: async () =>
      Promise.all([
        queryClient.invalidateQueries({
          exact: true,
          queryKey: ["agents", api.wallets.address],
        }),
        queryClient.invalidateQueries({
          exact: true,
          queryKey: ["agents", api.wallets.address, id],
        }),
      ]),
  });
}

export function useDeleteAgentMutation() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => api.agents.delete(id),

    onError: (_err, _id, ctx) => {
      const { listKey, previous } = ctx as AgentContext;
      qc.setQueryData(listKey, previous);
    },

    onMutate: async (id) => {
      const walletKey = String(api.wallets.address);
      const listKey = ["agents", walletKey] as const;

      await qc.cancelQueries({ queryKey: listKey });

      const previous = qc.getQueryData<AgentsResponse>(listKey);

      if (previous?.agents) {
        qc.setQueryData<AgentsResponse>(listKey, {
          ...previous,
          agents: previous.agents.filter((a) => a.id !== id),
        });
      }

      return { listKey, previous } as AgentContext;
    },
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
      api.agents.deploy(
        params.agentId,
        params.version,
        Amount.tryFrom(params.rhoLimit),
      ),
  });
}

export function useTestWalletMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async () => api.testnet.getWallet(),
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

export function useAgentsTeams() {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agentsTeams.get(),
    queryKey: ["agents-teams", api.wallets.address],
  });
}

export function useAgentsTeamVersions(id: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agentsTeams.getVersions(id),
    queryKey: ["agents-teams", api.wallets.address, id],
  });
}

export function useAgentsTeam(id: string, version: string) {
  const api = useApi();

  return useQuery({
    queryFn: async () => api.agentsTeams.getVersion(id, version),
    queryKey: ["agents-teams", api.wallets.address, id, version],
  });
}

type WithGraph<T> = Omit<T, "graph"> & {
  edges: Edge[];
  nodes: Node[];
};

export function useCreateAgentsTeamMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      edges,
      nodes,
      ...rest
    }: WithGraph<Parameters<AgentsTeamsApiSdk["create"]>[0]>) => {
      const graph = toApiGraph(nodes, edges);
      return api.agentsTeams.create({ ...rest, graph });
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({
        exact: true,
        queryKey: ["agents-teams", api.wallets.address],
      }),
  });
}

export function useSaveAgentsTeamMutation(id: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      edges,
      nodes,
      ...rest
    }: WithGraph<Parameters<AgentsTeamsApiSdk["save"]>[1]>) => {
      const graph = toApiGraph(nodes, edges);
      return api.agentsTeams.save(id, { ...rest, graph });
    },
    onSuccess: async () =>
      Promise.all([
        queryClient.invalidateQueries({
          exact: true,
          queryKey: ["agents-teams", api.wallets.address],
        }),
        queryClient.invalidateQueries({
          exact: true,
          queryKey: ["agents-teams", api.wallets.address, id],
        }),
      ]),
  });
}

export function useDeleteAgentsTeamMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => api.agentsTeams.delete(id),
    onSuccess: async (_, id) =>
      Promise.all([
        queryClient.invalidateQueries({
          exact: true,
          queryKey: ["agents-teams", api.wallets.address],
        }),
        queryClient.invalidateQueries({
          exact: false,
          queryKey: ["agents-teams", api.wallets.address, id],
        }),
      ]),
  });
}

export function useDeployGraphMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: {
      edges: Edge[];
      nodes: Node[];
      registryKey: PrivateKey;
      registryVersion: bigint;
      rhoLimit: bigint;
    }) => {
      const graph = toApiGraph(params.nodes, params.edges);
      return api.agentsTeams.deployGraph(
        graph,
        Amount.tryFrom(params.rhoLimit),
        params.registryVersion,
        params.registryKey,
      );
    },
  });
}

export function useDeployAgentsTeamMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: {
      agentsTeamId: string;
      registryKey: PrivateKey;
      registryVersion: bigint;
      rhoLimit: bigint;
      version: string;
    }) =>
      api.agentsTeams.deploy(
        params.agentsTeamId,
        params.version,
        Amount.tryFrom(params.rhoLimit),
        params.registryVersion,
        params.registryKey,
      ),
  });
}

export function useRunAgentsTeamMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: {
      prompt: string;
      rhoLimit: bigint;
      uri: string;
    }) =>
      api.agentsTeams.run(
        params.uri,
        params.prompt,
        Amount.tryFrom(params.rhoLimit),
      ),
  });
}
