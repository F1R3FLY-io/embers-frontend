import type { Graph } from "@f1r3fly-io/graphl-parser";

import init, { astToGraphl, parseToAst } from "@f1r3fly-io/graphl-parser";

export type { Graph } from "@f1r3fly-io/graphl-parser";

void init();

export function GraphFromJSON(json: any): Graph {
  return GraphFromJSONTyped(json, false);
}

export function GraphFromJSONTyped(
  json: any,
  _ignoreDiscriminator: boolean,
): Graph {
  return parseToAst(json);
}

export function GraphToJSON(value?: Graph | null): string | null | undefined {
  return GraphToJSONTyped(value, false);
}

export function GraphToJSONTyped(
  value?: Graph | null,
  _ignoreDiscriminator: boolean = false,
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return astToGraphl(value);
}
