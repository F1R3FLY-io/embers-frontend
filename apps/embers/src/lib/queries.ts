import type {
  Agents,
  AgentsTeams,
  CreateAgentReq,
  CreateAgentsTeamReq,
  CreateOslfReq,
  Oslfs,
  PrivateKey,
  PublishToFireskyReq,
  Uri,
} from "@f1r3fly-io/embers-client-sdk";
import type { QueryClient } from "@tanstack/react-query";

import { Amount } from "@f1r3fly-io/embers-client-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { PublishedState } from "@/lib/publishedState";

import { useApi } from "@/lib/providers/wallet/useApi";

import type { Edge, Node } from "./components/GraphEditor";

import { layoutAndNormalizeFromApi, toApiGraph } from "./graph";

interface DeleteContext<T> {
  listKey: readonly [string, string];
  previous?: T;
}

/**
 * Refetch a list until a just-written record shows up in it.
 *
 * The read node trails the validator, so the first read after a write usually
 * returns the list as it was. That is a successful response carrying stale data
 * rather than an empty one, so neither react-query's retry nor the backend's
 * retry-on-empty helpers notice, and it gets cached as if it were current —
 * leaving the record missing until something else happens to trigger a fetch.
 *
 * `type: "all"` matters: the list is usually inactive here, because writes come
 * from an editor page rather than the dashboard. Invalidating alone would only
 * mark it stale and refetch on the next mount, straight back into the same lag.
 */
async function refetchUntilPresent(
  client: QueryClient,
  queryKey: readonly unknown[],
  isPresent: () => boolean,
  attemptsLeft = 12,
  delayMs = 500,
): Promise<void> {
  await client.refetchQueries({ exact: true, queryKey, type: "all" });

  if (isPresent() || attemptsLeft <= 1) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

  return refetchUntilPresent(
    client,
    queryKey,
    isPresent,
    attemptsLeft - 1,
    Math.min(delayMs * 2, 4000),
  );
}

export function useAgents() {
  const api = useApi();

  return useQuery({
    queryFn: async ({ signal }) => api.agents.get({ signal }),
    queryKey: ["agents", String(api.wallets.address)],
  });
}

/**
 * Whether a team is published to F1R3SKY, and whether the account it names still
 * exists.
 *
 * Fetched directly rather than through the generated client. The client under
 * `packages/client/src/api-client` has been hand-extended -- `Graph` is mapped
 * through the WASM `astToGraphl`, which no generator emits -- so regenerating it to
 * add one endpoint would discard those edits and break the editor. Adding a method
 * to the generated files by hand is worse: they carry a "do not edit" header and the
 * change would be lost the first time anyone does regenerate. One narrow fetch,
 * against the same base URL the client uses, is the option that neither destroys
 * work nor plants a trap.
 *
 * Returns `null` when nothing is published; a 404 is the API saying so, not a
 * failure.
 */
export function useTeamPublishedState(id?: string) {
  const api = useApi();
  const address = String(api.wallets.address);

  return useQuery({
    enabled: !!id,
    queryFn: async ({ signal }): Promise<PublishedState | null> => {
      const response = await fetch(
        `${window.API_URL}/api/ai-agents-teams/${address}/${id!}/published`,
        { signal },
      );

      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`could not read publish state: ${response.status}`);
      }
      return response.json() as Promise<PublishedState>;
    },
    queryKey: ["agents-teams", address, id, "published"],
  });
}

export function useAgentVersions(id?: string) {
  const api = useApi();

  return useQuery({
    enabled: !!id,
    queryFn: async ({ signal }) => api.agents.getVersions(id!, { signal }),
    queryKey: ["agents", String(api.wallets.address), id],
  });
}

export function useAgent(id?: string, version?: string) {
  const api = useApi();

  return useQuery({
    enabled: !!id && !!version,
    queryFn: async ({ signal }) =>
      api.agents.getVersion(id!, version!, { signal }),
    queryKey: ["agents", String(api.wallets.address), id, version],
    retry: 10,
    retryDelay: (attempt) => {
      const base = Math.min(1000 * 2 ** attempt, 10_000);
      return base * (0.5 + Math.random());
    },
  });
}

export function useCreateAgentMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentReq, { client }) =>
      api.agents.create(params).then((r) => {
        const { id } = r.prepareResponse.response;
        const listKey = ["agents", String(api.wallets.address)];
        void r.waitForFinalization.finally(
          () =>
            void refetchUntilPresent(
              client,
              listKey,
              () =>
                client
                  .getQueryData<Agents>(listKey)
                  ?.agents.some((agent) => agent.id === id) ?? false,
            ),
        );
        return r;
      }),
  });
}

export function useSaveAgentMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateAgentReq, { client }) =>
      api.agents.save(id, params).then((r) => {
        const { version } = r.prepareResponse.response;
        void r.waitForFinalization.finally(() => {
          // Saving appends a version, so wait for that version specifically —
          // the agent itself is already listed.
          const listKey = ["agents", String(api.wallets.address)];
          void refetchUntilPresent(
            client,
            listKey,
            () =>
              client
                .getQueryData<Agents>(listKey)
                ?.agents.some(
                  (agent) => agent.id === id && agent.version === version,
                ) ?? false,
          );
          void client.invalidateQueries({
            exact: true,
            queryKey: ["agents", String(api.wallets.address), id],
          });
        });
        return r;
      }),
  });
}

export function useDeleteAgentMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (id: string) => api.agents.delete(id),

    onError: (_err, _id, ctx: DeleteContext<Agents> | undefined, { client }) =>
      ctx && client.setQueryData(ctx.listKey, ctx.previous),

    onMutate: async (id, { client }) => {
      const listKey = ["agents", String(api.wallets.address)] as const;

      await client.cancelQueries({ queryKey: listKey });

      const previous = client.getQueryData<Agents>(listKey);

      if (previous?.agents) {
        client.setQueryData<Agents>(listKey, {
          ...previous,
          agents: previous.agents.filter((a) => a.id !== id),
        });
      }

      return { listKey, previous };
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
    mutationFn: async (params: {
      env?: string;
      test: string;
      testKey: PrivateKey;
    }) => api.testnet.deploy(params.testKey, params.test, params.env),
  });
}

export function useAgentsTeams() {
  const api = useApi();

  return useQuery({
    queryFn: async ({ signal }) => api.agentsTeams.get({ signal }),
    queryKey: ["agents-teams", String(api.wallets.address)],
  });
}

export function useAgentsTeamVersions(id?: string) {
  const api = useApi();

  return useQuery({
    enabled: !!id,
    queryFn: async ({ signal }) => api.agentsTeams.getVersions(id!, { signal }),
    queryKey: ["agents-teams", String(api.wallets.address), id],
  });
}

export function useAgentsTeam(id?: string, version?: string) {
  const api = useApi();

  return useQuery({
    enabled: !!id && !!version,
    queryFn: async ({ signal }) => {
      const { graph, ...rest } = await api.agentsTeams.getVersion(
        id!,
        version!,
        {
          signal,
        },
      );

      let nodes: Node[] | undefined;
      let edges: Edge[] | undefined;

      if (graph !== undefined) {
        [nodes, edges] = layoutAndNormalizeFromApi(graph);
      }

      return {
        ...rest,
        edges,
        nodes,
      };
    },
    queryKey: ["agents-teams", String(api.wallets.address), id, version],
    retry: 10,
    retryDelay: (attempt) => {
      const base = Math.min(1000 * 2 ** attempt, 10_000);
      return base * (0.5 + Math.random());
    },
  });
}

type WithGraph<T> = Omit<T, "graph"> & {
  edges: Edge[];
  nodes: Node[];
};

export function useCreateAgentsTeamMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (
      { edges, nodes, ...rest }: WithGraph<CreateAgentsTeamReq>,
      { client },
    ) => {
      const graph = toApiGraph(nodes, edges);
      return api.agentsTeams.create({ ...rest, graph }).then((r) => {
        const { id } = r.prepareResponse.response;
        const listKey = ["agents-teams", String(api.wallets.address)];
        void r.waitForFinalization.finally(
          () =>
            void refetchUntilPresent(
              client,
              listKey,
              () =>
                client
                  .getQueryData<AgentsTeams>(listKey)
                  ?.agentsTeams.some((team) => team.id === id) ?? false,
            ),
        );

        return r;
      });
    },
  });
}

export function useSaveAgentsTeamMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async (
      { edges, nodes, ...rest }: WithGraph<CreateAgentsTeamReq>,
      { client },
    ) => {
      const graph = toApiGraph(nodes, edges);
      return api.agentsTeams.save(id, { ...rest, graph }).then((r) => {
        const { version } = r.prepareResponse.response;
        void r.waitForFinalization.finally(() => {
          const listKey = ["agents-teams", String(api.wallets.address)];
          void refetchUntilPresent(
            client,
            listKey,
            () =>
              client
                .getQueryData<AgentsTeams>(listKey)
                ?.agentsTeams.some(
                  (team) => team.id === id && team.version === version,
                ) ?? false,
          );
          void client.invalidateQueries({
            exact: true,
            queryKey: ["agents-teams", String(api.wallets.address), id],
          });
        });
        return r;
      });
    },
  });
}

export function useDeleteAgentsTeamMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (id: string) => api.agentsTeams.delete(id),
    onError: (
      _err,
      _id,
      ctx: DeleteContext<AgentsTeams> | undefined,
      { client },
    ) => ctx && client.setQueryData(ctx.listKey, ctx.previous),

    onMutate: async (id, { client }) => {
      const listKey = ["agents-teams", String(api.wallets.address)] as const;

      await client.cancelQueries({ queryKey: listKey });

      const previous = client.getQueryData<AgentsTeams>(listKey);

      if (previous?.agentsTeams) {
        client.setQueryData<AgentsTeams>(listKey, {
          ...previous,
          agentsTeams: previous.agentsTeams.filter((a) => a.id !== id),
        });
      }

      return { listKey, previous };
    },
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
      uri: Uri;
    }) =>
      api.agentsTeams.run(
        params.uri,
        params.prompt,
        Amount.tryFrom(params.rhoLimit),
      ),
  });
}

export function usePublishAgentsTeamToFireskyMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: PublishToFireskyReq) =>
      api.agentsTeams.publishToFiresky(id, params),
  });
}

export function useOslfs() {
  const api = useApi();

  return useQuery({
    queryFn: async ({ signal }) => api.oslfs.get({ signal }),
    queryKey: ["oslf", String(api.wallets.address)],
  });
}

export function useOslfVersions(id?: string) {
  const api = useApi();

  return useQuery({
    enabled: !!id,
    queryFn: async ({ signal }) => api.oslfs.getVersions(id!, { signal }),
    queryKey: ["oslf", String(api.wallets.address), id],
  });
}

export function useOslf(id?: string, version?: string) {
  const api = useApi();

  return useQuery({
    enabled: !!id && !!version,
    queryFn: async ({ signal }) =>
      api.oslfs.getVersion(id!, version!, { signal }),
    queryKey: ["oslf", String(api.wallets.address), id, version],
  });
}

export function useCreateOslfMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateOslfReq, { client }) =>
      api.oslfs.create(params).then((r) => {
        void r.waitForFinalization.finally(() => {
          void client.invalidateQueries({
            exact: true,
            queryKey: ["oslf", String(api.wallets.address)],
          });
        });
        return r;
      }),
  });
}

export function useSaveOslfMutation(id: string) {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: CreateOslfReq, { client }) =>
      api.oslfs.save(id, params).then((r) => {
        void r.waitForFinalization.finally(() => {
          void client.invalidateQueries({
            exact: true,
            queryKey: ["oslf", String(api.wallets.address)],
          });
          void client.invalidateQueries({
            exact: true,
            queryKey: ["oslf", String(api.wallets.address), id],
          });
        });
        return r;
      }),
  });
}

export function useDeleteOslfMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (id: string) => api.oslfs.delete(id),

    onError: (_err, _id, ctx: DeleteContext<Oslfs> | undefined, { client }) =>
      ctx && client.setQueryData(ctx.listKey, ctx.previous),

    onMutate: async (id, { client }) => {
      const listKey = ["oslf", String(api.wallets.address)] as const;

      await client.cancelQueries({ queryKey: listKey });

      const previous = client.getQueryData<Oslfs>(listKey);

      if (previous?.oslfs) {
        client.setQueryData<Oslfs>(listKey, {
          ...previous,
          oslfs: previous.oslfs.filter((a) => a.id !== id),
        });
      }

      return { listKey, previous };
    },
  });
}
