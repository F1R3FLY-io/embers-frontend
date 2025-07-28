/* eslint-disable @typescript-eslint/no-explicit-any */
export type UnixTimestamp = Date;

export function UnixTimestampFromJSON(json: any): UnixTimestamp {
  return UnixTimestampFromJSONTyped(json, false);
}

export function UnixTimestampFromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): UnixTimestamp {
  return new Date(json * 1000);
}

export function UnixTimestampToJSON(
  value?: UnixTimestamp | null,
): string | null | undefined {
  return UnixTimestampToJSONTyped(value, false);
}

export function UnixTimestampToJSONTyped(
  value?: UnixTimestamp | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  if (!value) {
    return value;
  }

  Math.floor(value.getTime() / 1000).toString();
}
