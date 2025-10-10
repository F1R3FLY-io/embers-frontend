import { PublicKey } from "@/entities/PublicKey";
export type { PublicKey } from "@/entities/PublicKey";

export function PublicKeyFromJSON(json: any): PublicKey {
  return PublicKeyFromJSONTyped(json, false);
}

export function PublicKeyFromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): PublicKey {
  return PublicKey.tryFromHex(json);
}

export function PublicKeyToJSON(
  value?: PublicKey | null,
): string | null | undefined {
  return PublicKeyToJSONTyped(value, false);
}

export function PublicKeyToJSONTyped(
  value?: PublicKey | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return value.toHex();
}
