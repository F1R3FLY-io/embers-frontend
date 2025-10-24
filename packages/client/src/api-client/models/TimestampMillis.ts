export type TimestampMillis = Date;

export function TimestampMillisFromJSON(json: any): TimestampMillis {
  return TimestampMillisFromJSONTyped(parseInt(json), false);
}

export function TimestampMillisFromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): TimestampMillis {
  return new Date(json);
}

export function TimestampMillisToJSON(
  value?: TimestampMillis | null,
): string | null | undefined {
  return TimestampMillisToJSONTyped(value, false);
}

export function TimestampMillisToJSONTyped(
  value?: TimestampMillis | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  if (!value) {
    return value;
  }

  return Math.floor(value.getTime()).toString();
}
