import { Address } from "@/entities/Address";
export { Address } from "@/entities/Address";

export function AddressFromJSON(json: any): Address {
  return AddressFromJSONTyped(json, false);
}

export function AddressFromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): Address {
  return Address.tryFrom(json);
}

export function AddressToJSON(
  value?: Address | null,
): string | null | undefined {
  return AddressToJSONTyped(value, false);
}

export function AddressToJSONTyped(
  value?: Address | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return value.value;
}
