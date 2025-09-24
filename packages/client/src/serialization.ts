import { base16 } from "@scure/base";
import { z } from "zod/mini";

import { PrivateKey } from "@/entities/PrivateKey";

export const ValueFormat = z.enum(["hex"]);
export type ValueFormat = z.infer<typeof ValueFormat>;

export const KeyType = z.enum(["secp256k1"]);
export type KeyType = z.infer<typeof KeyType>;

export const WalletFile = z.object({
  keyType: KeyType,
  value: z.string(),
  valueFormat: ValueFormat,
});
export type WalletFile = z.infer<typeof WalletFile>;

export function serializeKey(key: PrivateKey): string {
  const fileContent: WalletFile = {
    keyType: "secp256k1",
    value: base16.encode(key.value),
    valueFormat: "hex",
  };

  return JSON.stringify(fileContent);
}

export function deserializeKey(fileContent: string): PrivateKey {
  const json: unknown = JSON.parse(fileContent);
  const { value } = WalletFile.parse(json);
  return PrivateKey.tryFromHex(value);
}
