/* tslint:disable */
/* eslint-disable */
/**
 * Embers API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.1.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from "../runtime";
/**
 *
 * @export
 * @interface AgentHeader
 */
export interface AgentHeader {
  /**
   *
   * @type {string}
   * @memberof AgentHeader
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof AgentHeader
   */
  version: string;
  /**
   *
   * @type {string}
   * @memberof AgentHeader
   */
  name: string;
  /**
   *
   * @type {string}
   * @memberof AgentHeader
   */
  shard?: string;
}

/**
 * Check if a given object implements the AgentHeader interface.
 */
export function instanceOfAgentHeader(value: object): value is AgentHeader {
  if (!("id" in value) || value["id"] === undefined) return false;
  if (!("version" in value) || value["version"] === undefined) return false;
  if (!("name" in value) || value["name"] === undefined) return false;
  return true;
}

export function AgentHeaderFromJSON(json: any): AgentHeader {
  return AgentHeaderFromJSONTyped(json, false);
}

export function AgentHeaderFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean,
): AgentHeader {
  if (json == null) {
    return json;
  }
  return {
    id: json["id"],
    version: json["version"],
    name: json["name"],
    shard: json["shard"] == null ? undefined : json["shard"],
  };
}

export function AgentHeaderToJSON(json: any): AgentHeader {
  return AgentHeaderToJSONTyped(json, false);
}

export function AgentHeaderToJSONTyped(
  value?: AgentHeader | null,
  ignoreDiscriminator: boolean = false,
): any {
  if (value == null) {
    return value;
  }

  return {
    id: value["id"],
    version: value["version"],
    name: value["name"],
    shard: value["shard"],
  };
}
