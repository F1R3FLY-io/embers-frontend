import { useMutation, useQuery } from "@tanstack/react-query";

import {
  fromPrivateKeyHex,
  signPayload,
  type Signed,
  type Wallet,
} from "../../wallet";

import {
  Agent,
  Agents,
  CreateAgentResp,
  CreateTestwalletResp,
  type DeployReq,
  type DeployTestReq,
  DeployTestResp,
  SaveAgentResp,
  type CreateAgentReq,
  DeploResp,
  DeploySignedTestResp,
} from "./model";

export const FIREFLY_API_URL = `${
  import.meta.env.VITE_FIREFLY_API_URL
}/api/ai-agents`;

export function useAgents(address: string) {
  return useQuery({
    queryKey: ["ai-agents", address],
    queryFn: () =>
      fetch(`${FIREFLY_API_URL}/${address}`)
        .then((req) => req.json())
        .then((json) => Agents.parse(json)),
  });
}

export function useAgentVersions(address: string, id: string) {
  return useQuery({
    queryKey: ["ai-agents", address, id],
    queryFn: () =>
      fetch(`${FIREFLY_API_URL}/${address}/${id}/versions`)
        .then((req) => req.json())
        .then((json) => Agents.parse(json)),
  });
}

export function useAgent(address: string, id: string, version: string) {
  return useQuery({
    queryKey: ["ai-agents", address, id, version],
    queryFn: () =>
      fetch(`${FIREFLY_API_URL}/${address}/${id}/${version}`)
        .then((req) => req.json())
        .then((json) => Agent.parse(json)),
  });
}

export function useCreateAgentMutation(wallet: Wallet) {
  return useMutation({
    mutationFn: async ({ name, shard, code }: CreateAgentReq) => {
      const resp = await fetch(`${FIREFLY_API_URL}/create/prepare`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name,
          shard,
          code,
        }),
      });

      const body = await resp.json();
      const { id, version, contract } = CreateAgentResp.parse(body);
      const signature = signPayload(wallet.key, contract);

      return await fetch(`${FIREFLY_API_URL}/create/send`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(signatureToBody(contract, signature)),
      }).then(() => ({
        id,
        version,
        name,
        shard,
        code,
      }));
    },
  });
}

export function useSaveAgentMutation(wallet: Wallet, id: string) {
  return useMutation({
    mutationFn: async ({ name, shard, code }: CreateAgentReq) => {
      const resp = await fetch(`${FIREFLY_API_URL}/${id}/save/prepare`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name,
          shard,
          code,
        }),
      });

      const body = await resp.json();
      const { version, contract } = SaveAgentResp.parse(body);
      const signature = signPayload(wallet.key, contract);

      return await fetch(`${FIREFLY_API_URL}/${id}/save/send`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(signatureToBody(contract, signature)),
      }).then(() => ({
        id,
        version,
        name,
        shard,
        code,
      }));
    },
  });
}

export function useCreateTestWalletMutation() {
  return useMutation({
    mutationFn: async () => {
      return await fetch(`${FIREFLY_API_URL}/test/wallet`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      })
        .then((req) => req.json())
        .then((json) => CreateTestwalletResp.parse(json))
        .then(({ key }) => fromPrivateKeyHex(key));
    },
  });
}

export function useDeployTestMutation(wallet: Wallet) {
  return useMutation({
    mutationFn: async ({ env, test }: DeployTestReq) => {
      const resp = await fetch(`${FIREFLY_API_URL}/test/deploy/prepare`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          env,
          test,
        }),
      });

      const body = await resp.json();
      const { env_contract, test_contract } = DeployTestResp.parse(body);

      const envSignature =
        env_contract && signPayload(wallet.key, env_contract);
      const testSignature = signPayload(wallet.key, test_contract);

      return await fetch(`${FIREFLY_API_URL}/test/deploy/send`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          env: envSignature && signatureToBody(env_contract, envSignature),
          test: signatureToBody(test_contract, testSignature),
        }),
      })
        .then((req) => req.json())
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
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }
      );

      const body = await resp.json();
      const { contract } = DeploResp.parse(body);
      const signature = signPayload(wallet.key, contract);

      return await fetch(
        `${FIREFLY_API_URL}/${wallet.address}/${id}/${version}/deploy/send`,
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(signatureToBody(contract, signature)),
        }
      );
    },
  });
}

function signatureToBody(contract: Uint8Array, signed: Signed) {
  return {
    contract: Array.from(contract),
    sig: Array.from(signed.signature),
    sig_algorithm: signed.sigAlgorithm,
    deployer: Array.from(signed.deployer),
  };
}
