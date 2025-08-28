export type Int64 = bigint;

export function Int64FromJSON(json: any): Int64 {
  return Int64FromJSONTyped(json, false);
}

export function Int64FromJSONTyped(json: any, _ignoreDiscriminator: boolean): Int64 {
  return BigInt(json);
}

export function Int64ToJSON(value?: Int64 | null): string | null | undefined {
  return Int64ToJSONTyped(value, false);
}

export function Int64ToJSONTyped(
  value?: Int64 | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return value.toString();
}
