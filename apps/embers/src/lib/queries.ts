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

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { PublishedState, ReferencingTeam } from "@/lib/publishedState";

import { useAlert } from "@/lib/providers/modal/useConfirm";
import { useApi } from "@/lib/providers/wallet/useApi";

import type { Edge, Node } from "./components/GraphEditor";
import type { WorkflowDefinitionV2 } from "./workflow";

import { layoutAndNormalizeFromApi, toApiGraph } from "./graph";
import { fromWorkflowDefinition, toWorkflowDefinition } from "./workflow";

interface DeleteContext<T> {
  listKey: readonly [string, string];
  previous?: T;
}

/**
 * The reason a request failed, in the server's own words where it gave any.
 *
 * A bare status code names the category and not the cause, which is exactly the gap
 * that made a rejected delete indistinguishable from a slow one. The body is what
 * the backend already writes its diagnostics into -- "no agent ... named Refine",
 * say -- so it is worth the extra read on the failure path.
 */
async function failureReason(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.text().catch(() => "");
  const detail = body.trim();

  return detail === ""
    ? `${fallback}: ${response.status}`
    : `${fallback}: ${detail}`;
}

/**
 * Shows the reason a mutation failed.
 *
 * Rolling an optimistic update back is not enough on its own: the row vanishes and
 * silently returns, which reads as a glitch rather than a rejection. The message is
 * what turns it into something the user can act on.
 */
function useFailureReporter() {
  const alert = useAlert();

  return (title: string, error: unknown) => {
    const reason =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "The change could not be completed.";

    void alert({ message: `${title}: ${reason}`, title });
  };
}

/**
 * Refetch a list until it settles into the state a write just put on chain.
 *
 * The read node trails the validator, so the first read after a write usually
 * returns the list as it was. That is a successful response carrying stale data
 * rather than an empty one, so neither react-query's retry nor the backend's
 * retry-on-empty helpers notice, and it gets cached as if it were current —
 * leaving a created record missing, or a deleted one present, until something else
 * happens to trigger a fetch.
 *
 * `settled` rather than a fixed direction: creation and deletion suffer the same lag
 * and are answered by the same loop. They were allowed to drift apart once already,
 * when creation was hardened against the trailing observer and deletion was not.
 *
 * `type: "all"` matters: the list is usually inactive here, because writes come
 * from an editor page rather than the dashboard. Invalidating alone would only
 * mark it stale and refetch on the next mount, straight back into the same lag.
 *
 * Bounded at twelve attempts with exponential backoff capped at four seconds -- about
 * a minute in total. Giving up leaves the cache showing whatever the node last
 * returned, which is the pre-existing behaviour, rather than looping forever.
 */
/* Exported for tests: the loop's termination and the fact that it polls rather than
 * refetching once are the behaviour that regressed, and neither is observable
 * through the mutations without a live chain. */
export async function refetchUntil(
  client: QueryClient,
  queryKey: readonly unknown[],
  settled: () => boolean,
  attemptsLeft = 12,
  delayMs = 500,
): Promise<void> {
  await client.refetchQueries({ exact: true, queryKey, type: "all" });

  if (settled() || attemptsLeft <= 1) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

  return refetchUntil(
    client,
    queryKey,
    settled,
    attemptsLeft - 1,
    Math.min(delayMs * 2, 4000),
  );
}

/** Waits for a written record to appear in a cached list. */
async function refetchUntilPresent(
  client: QueryClient,
  queryKey: readonly unknown[],
  isPresent: () => boolean,
): Promise<void> {
  return refetchUntil(client, queryKey, isPresent);
}

/**
 * Waits for a deleted record to stop appearing in a cached list.
 *
 * The mirror of `refetchUntilPresent`, and expressed through the same helper on
 * purpose: the two were allowed to drift once already. Creation was hardened against
 * the trailing observer while deletion was not, so a deleted row could reappear on
 * the next refetch -- the same stale-but-successful read, in the other direction.
 */
async function refetchUntilAbsent(
  client: QueryClient,
  queryKey: readonly unknown[],
  isGone: () => boolean,
): Promise<void> {
  return refetchUntil(client, queryKey, isGone);
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

/**
 * Reads which teams would be broken by deleting a given agent.
 *
 * A reader rather than a `useQuery`, because the answer is wanted at the moment a
 * deletion is confirmed and about the agent then being deleted. Keying a query by a
 * piece of component state would ask about whichever agent the state held at the last
 * render -- `undefined` on the first deletion, and the *previously* deleted agent on
 * every one after it. That is not a stale cache but a wrong answer, and it would be
 * acted on by destroying the teams it named.
 *
 * Uncached for the same reason: the list decides what is about to be deleted, so it
 * must describe the wallet as it is now rather than as it was when some earlier page
 * happened to read it.
 */
export function useReferencingTeamsReader() {
  const api = useApi();
  const address = String(api.wallets.address);

  return useCallback(
    async (agentId: string): Promise<ReferencingTeam[]> => {
      const response = await fetch(
        `${window.API_URL}/api/ai-agents-teams/${address}/referencing/${agentId}`,
      );

      if (!response.ok) {
        // Deliberately not a silent empty list: an under-reported answer would
        // understate what a deletion is about to destroy.
        throw new Error(
          await failureReason(
            response,
            "could not determine which teams use this agent",
          ),
        );
      }
      return response.json() as Promise<ReferencingTeam[]>;
    },
    [address],
  );
}

/**
 * Reads how one team's publication stands, at the moment it is asked.
 *
 * The same shape and the same reason as `useReferencingTeamsReader`: a deletion has
 * to know whether *this* team is answering mentions, and a query keyed by render-time
 * state would answer about a different team.
 */
export function useTeamPublicationReader() {
  const api = useApi();
  const address = String(api.wallets.address);

  return useCallback(
    async (id: string): Promise<PublishedState | null> => {
      const response = await fetch(
        `${window.API_URL}/api/ai-agents-teams/${address}/${id}/published`,
      );

      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(
          await failureReason(response, "could not read publish state"),
        );
      }
      return response.json() as Promise<PublishedState | null>;
    },
    [address],
  );
}

/** Stops a published team answering mentions, keeping its account and handle. */
export function useUnpublishAgentsTeamMutation() {
  const api = useApi();
  const address = String(api.wallets.address);
  const reportFailure = useFailureReporter();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `${window.API_URL}/api/ai-agents-teams/${address}/${id}/unpublish`,
        { method: "POST" },
      );

      if (!response.ok) {
        throw new Error(await failureReason(response, "could not unpublish"));
      }
    },

    // A failed unpublish stops the cascade, so it has to say why: the team is still
    // answering mentions, and nothing else in the flow will mention that again.
    onError: (err) => {
      reportFailure("Unpublish failed", err);
    },
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
  const reportFailure = useFailureReporter();

  return useMutation({
    mutationFn: async (id: string) => api.agents.delete(id),

    // Roll the optimistic removal back **and say why**. The error was
    // discarded before, so a delete rejected on chain looked like the row
    // vanishing and silently coming back, with nothing to explain it.
    onError: (err, _id, ctx: DeleteContext<Agents> | undefined, { client }) => {
      if (ctx) {
        client.setQueryData(ctx.listKey, ctx.previous);
      }
      reportFailure("Delete failed", err);
    },

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

    // Reconcile with the chain rather than trusting the optimistic removal.
    // Without this the row can reappear on any later refetch, because the
    // observer node trails the validator and answers successfully with the
    // record still present -- the same stale-but-successful read that hid a
    // newly created record until this was fixed for creation.
    onSuccess: async (result, id, _ctx, { client }) => {
      await result.waitForFinalization;
      const listKey = ["agents", String(api.wallets.address)] as const;
      await refetchUntilAbsent(
        client,
        listKey,
        () =>
          !(
            client
              .getQueryData<Agents>(listKey)
              ?.agents.some((entry) => entry.id === id) ?? false
          ),
      );
    },
  });
}

export function useDeployCodeMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: { code: string }) =>
      api.agents.deployCode(params.code),
  });
}

export function useDeployAgentMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: { agentId: string; version: string }) =>
      api.agents.deploy(params.agentId, params.version),
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
      const response = await api.agentsTeams.getVersion(id!, version!, {
        signal,
      });
      const definition: unknown = response.definition;
      const { graph } = response;

      let nodes: Node[] | undefined;
      let edges: Edge[] | undefined;

      if (definition !== undefined) {
        [nodes, edges] = fromWorkflowDefinition(
          definition as WorkflowDefinitionV2,
        );
      } else if (graph !== undefined) {
        [nodes, edges] = layoutAndNormalizeFromApi(graph);
      }

      return {
        ...response,
        definition: definition as WorkflowDefinitionV2 | undefined,
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
      const definition = toWorkflowDefinition(
        nodes,
        edges,
        rest.definition as WorkflowDefinitionV2 | undefined,
      );
      return api.agentsTeams
        .create({ ...rest, definition, graph })
        .then((r) => {
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
      const definition = toWorkflowDefinition(
        nodes,
        edges,
        rest.definition as WorkflowDefinitionV2 | undefined,
      );
      return api.agentsTeams
        .save(id, { ...rest, definition, graph })
        .then((r) => {
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
  const reportFailure = useFailureReporter();

  return useMutation({
    mutationFn: async (id: string) => api.agentsTeams.delete(id),
    // Roll the optimistic removal back **and say why**. The error was
    // discarded before, so a delete rejected on chain looked like the row
    // vanishing and silently coming back, with nothing to explain it.
    onError: (
      err,
      _id,
      ctx: DeleteContext<AgentsTeams> | undefined,
      { client },
    ) => {
      if (ctx) {
        client.setQueryData(ctx.listKey, ctx.previous);
      }
      reportFailure("Delete failed", err);
    },

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

    // Reconcile with the chain rather than trusting the optimistic removal.
    // Without this the row can reappear on any later refetch, because the
    // observer node trails the validator and answers successfully with the
    // record still present -- the same stale-but-successful read that hid a
    // newly created record until this was fixed for creation.
    onSuccess: async (result, id, _ctx, { client }) => {
      await result.waitForFinalization;
      const listKey = ["agents-teams", String(api.wallets.address)] as const;
      await refetchUntilAbsent(
        client,
        listKey,
        () =>
          !(
            client
              .getQueryData<AgentsTeams>(listKey)
              ?.agentsTeams.some((entry) => entry.id === id) ?? false
          ),
      );
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
    }) => {
      const graph = toApiGraph(params.nodes, params.edges);
      return api.agentsTeams.deployGraph(
        graph,
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
      version: string;
    }) =>
      api.agentsTeams.deploy(
        params.agentsTeamId,
        params.version,
        params.registryVersion,
        params.registryKey,
      ),
  });
}

export function useRunAgentsTeamMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: { prompt: string; uri: Uri }) =>
      api.agentsTeams.run(params.uri, params.prompt),
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
  const reportFailure = useFailureReporter();

  return useMutation({
    mutationFn: async (id: string) => api.oslfs.delete(id),

    // Roll the optimistic removal back **and say why**. The error was
    // discarded before, so a delete rejected on chain looked like the row
    // vanishing and silently coming back, with nothing to explain it.
    onError: (err, _id, ctx: DeleteContext<Oslfs> | undefined, { client }) => {
      if (ctx) {
        client.setQueryData(ctx.listKey, ctx.previous);
      }
      reportFailure("Delete failed", err);
    },

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

    // Reconcile with the chain rather than trusting the optimistic removal.
    // Without this the row can reappear on any later refetch, because the
    // observer node trails the validator and answers successfully with the
    // record still present -- the same stale-but-successful read that hid a
    // newly created record until this was fixed for creation.
    onSuccess: async (result, id, _ctx, { client }) => {
      await result.waitForFinalization;
      const listKey = ["oslf", String(api.wallets.address)] as const;
      await refetchUntilAbsent(
        client,
        listKey,
        () =>
          !(
            client
              .getQueryData<Oslfs>(listKey)
              ?.oslfs.some((entry) => entry.id === id) ?? false
          ),
      );
    },
  });
}
