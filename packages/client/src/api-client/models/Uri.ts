import { Uri } from "@/entities/Uri";
export type { Uri } from "@/entities/Uri";

export function UriFromJSON(json: any): Uri {
  return UriFromJSONTyped(json, false);
}

export function UriFromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): Uri {
  return Uri.tryFrom(json);
}

export function UriToJSON(value?: Uri | null): string | null | undefined {
  return UriToJSONTyped(value, false);
}

export function UriToJSONTyped(
  value?: Uri | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  return value?.value;
}
