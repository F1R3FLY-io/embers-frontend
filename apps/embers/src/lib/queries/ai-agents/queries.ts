import { useMutation, useQuery } from "@tanstack/react-query";

import type { Signed, Wallet } from "@/lib/wallet";

import { fromPrivateKeyHex, signPayload } from "@/lib/wallet";

import type { CreateAgentReq, DeployReq, DeployTestReq } from "./model";

import {
  Agent,
  Agents,
  CreateAgentResp,
  CreateTestwalletResp,
  DeploResp,
  DeploySignedTestResp,
  DeployTestResp,
  SaveAgentResp,
} from "./model";

export const FIREFLY_API_URL = `${
  import.meta.env.VITE_FIREFLY_API_URL
}/api/ai-agents`;

export function useAgents(address: string) {
  return useQuery({
    queryFn: async () =>
      fetch(`${FIREFLY_API_URL}/${address}`)
        .then(async (resp) => resp.json() as Promise<unknown>)
        .then((json) => Agents.parse(json)),
    queryKey: ["ai-agents", address],
  });
}

export function useAgentVersions(address: string, id: string) {
  return useQuery({
    queryFn: async () =>
      fetch(`${FIREFLY_API_URL}/${address}/${id}/versions`)
        .then(async (resp) => resp.json() as Promise<unknown>)
        .then((json) => Agents.parse(json)),
    queryKey: ["ai-agents", address, id],
  });
}

export function useAgent(address: string, id: string, version: string) {
  return useQuery({
    queryFn: async () =>
      fetch(`${FIREFLY_API_URL}/${address}/${id}/${version}`)
        .then(async (resp) => resp.json() as Promise<unknown>)
        .then((json) => Agent.parse(json)),
    queryKey: ["ai-agents", address, id, version],
  });
}

export function useCreateAgentMutation(wallet: Wallet) {
  return useMutation({
    mutationFn: async ({ code, name, shard }: CreateAgentReq) => {
      const resp = await fetch(`${FIREFLY_API_URL}/create/prepare`, {
        body: JSON.stringify({
          code,
          name,
          shard,
        }),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });

      const body: unknown = await resp.json();
      const { contract, id, version } = CreateAgentResp.parse(body);
      const signature = signPayload(wallet.key, contract);

      return fetch(`${FIREFLY_API_URL}/create/send`, {
        body: JSON.stringify(signatureToBody(contract, signature)),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        method: "POST",
      }).then(() => ({
        code,
        id,
        name,
        shard,
        version,
      }));
    },
  });
}

export function useSaveAgentMutation(wallet: Wallet, id: string) {
  return useMutation({
    mutationFn: async ({ code, name, shard }: CreateAgentReq) => {
      const resp = await fetch(`${FIREFLY_API_URL}/${id}/save/prepare`, {
        body: JSON.stringify({
          code,
          name,
          shard,
        }),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });

      const body: unknown = await resp.json();
      const { contract, version } = SaveAgentResp.parse(body);
      const signature = signPayload(wallet.key, contract);

      return fetch(`${FIREFLY_API_URL}/${id}/save/send`, {
        body: JSON.stringify(signatureToBody(contract, signature)),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        method: "POST",
      }).then(() => ({
        code,
        id,
        name,
        shard,
        version,
      }));
    },
  });
}

export function useCreateTestWalletMutation() {
  return useMutation({
    mutationFn: async () =>
      fetch(`${FIREFLY_API_URL}/test/wallet`, {
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        method: "POST",
      })
        .then(async (resp) => resp.json() as Promise<unknown>)
        .then((json) => CreateTestwalletResp.parse(json))
        .then(({ key }) => fromPrivateKeyHex(key)),
  });
}

export function useDeployTestMutation(wallet: Wallet) {
  return useMutation({
    mutationFn: async ({ env, test }: DeployTestReq) => {
      const resp = await fetch(`${FIREFLY_API_URL}/test/deploy/prepare`, {
        body: JSON.stringify({
          env,
          test,
        }),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });

      const body: unknown = await resp.json();
      const { env_contract, test_contract } = DeployTestResp.parse(body);

      const envSignature =
        env_contract && signPayload(wallet.key, env_contract);
      const testSignature = signPayload(wallet.key, test_contract);

      return fetch(`${FIREFLY_API_URL}/test/deploy/send`, {
        body: JSON.stringify({
          env: envSignature && signatureToBody(env_contract, envSignature),
          test: signatureToBody(test_contract, testSignature),
        }),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        method: "POST",
      })
        .then(async (resp) => resp.json() as Promise<unknown>)
        .then((json) => DeploySignedTestResp.parse(json));
    },
  });
}

export function useDeployMutation(wallet: Wallet) {
  return useMutation({
    mutationFn: async ({ id, version }: DeployReq) => {
      const resp = await fetch(
        `${FIREFLY_API_URL}/${wallet.address}/${id}/${version}/deploy/prepare`,
        {
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          method: "POST",
        },
      );

      const body: unknown = await resp.json();
      const { contract } = DeploResp.parse(body);
      const signature = signPayload(wallet.key, contract);

      return fetch(
        `${FIREFLY_API_URL}/${wallet.address}/${id}/${version}/deploy/send`,
        {
          body: JSON.stringify(signatureToBody(contract, signature)),
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          method: "POST",
        },
      );
    },
  });
}

function signatureToBody(contract: Uint8Array, signed: Signed) {
  return {
    contract: Array.from(contract),
    deployer: Array.from(signed.deployer),
    sig: Array.from(signed.signature),
    sig_algorithm: signed.sigAlgorithm,
  };
}
