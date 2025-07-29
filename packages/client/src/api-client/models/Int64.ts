/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Int64 = bigint;

export function Int64FromJSON(json: any): Int64 {
  return Int64FromJSONTyped(json, false);
}

export function Int64FromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): Int64 {
  return BigInt(json);
}

export function Int64ToJSON(value?: Int64 | null) {
  return Int64ToJSONTyped(value, false);
}

export function Int64ToJSONTyped(
  value?: Int64 | null,
  _ignoreDiscriminator: boolean = false,
) {
  if (!value) {
    return value;
  }

  return value.toString();
}
