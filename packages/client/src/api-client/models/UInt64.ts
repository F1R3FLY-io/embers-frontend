export type UInt64 = bigint;

export function UInt64FromJSON(json: any): UInt64 {
  return UInt64FromJSONTyped(json, false);
}

export function UInt64FromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): UInt64 {
  const bigInt = BigInt(json);
  if (bigInt < 0n) {
    throw new Error("Value must be unsigned");
  }

  return bigInt;
}

export function UInt64ToJSON(value?: UInt64 | null): string | null | undefined {
  return UInt64ToJSONTyped(value, false);
}

export function UInt64ToJSONTyped(
  value?: UInt64 | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return value.toString();
}
