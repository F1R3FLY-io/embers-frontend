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
 * @interface DeployTestResp
 */
export interface DeployTestResp {
  /**
   *
   * @type {Array<number>}
   * @memberof DeployTestResp
   */
  envContract?: Array<number>;
  /**
   *
   * @type {Array<number>}
   * @memberof DeployTestResp
   */
  testContract: Array<number>;
}

/**
 * Check if a given object implements the DeployTestResp interface.
 */
export function instanceOfDeployTestResp(
  value: object,
): value is DeployTestResp {
  if (!("testContract" in value) || value["testContract"] === undefined)
    return false;
  return true;
}

export function DeployTestRespFromJSON(json: any): DeployTestResp {
  return DeployTestRespFromJSONTyped(json, false);
}

export function DeployTestRespFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean,
): DeployTestResp {
  if (json == null) {
    return json;
  }
  return {
    envContract:
      json["env_contract"] == null ? undefined : json["env_contract"],
    testContract: json["test_contract"],
  };
}

export function DeployTestRespToJSON(json: any): DeployTestResp {
  return DeployTestRespToJSONTyped(json, false);
}

export function DeployTestRespToJSONTyped(
  value?: DeployTestResp | null,
  ignoreDiscriminator: boolean = false,
): any {
  if (value == null) {
    return value;
  }

  return {
    env_contract: value["envContract"],
    test_contract: value["testContract"],
  };
}
