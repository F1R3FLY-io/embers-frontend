/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { base64 } from "@scure/base";

export type Base64 = Uint8Array;

export function Base64FromJSON(json: any): Base64 {
  return Base64FromJSONTyped(json, false);
}

export function Base64FromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): Base64 {
  return base64.decode(json);
}

export function Base64ToJSON(value?: Base64 | null): string | null | undefined {
  return Base64ToJSONTyped(value, false);
}

export function Base64ToJSONTyped(
  value?: Base64 | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return base64.encode(value);
}
