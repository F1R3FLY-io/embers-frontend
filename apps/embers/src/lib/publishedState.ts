/**
 * The shapes of the two endpoints read directly rather than through the generated
 * API client.
 *
 * That client is hand-extended -- `Graph` is mapped through the WASM `astToGraphl`,
 * which no generator emits -- so regenerating it to pick these up would discard those
 * edits and break the editor. Their shapes are therefore described here, beside the
 * code that reads them.
 */

/** A team whose latest version uses a given agent, from `…/referencing/{agentId}`. */
export type ReferencingTeam = {
  id: string;
  name: string;
  /** Whether any deployment of this team is published. */
  published: boolean;
  /** The handle it was published under; absent on publications predating capture. */
  published_handle: string | null;
  version: string;
};

/**
 * How a team's publication to F1R3SKY stands, from
 * `GET /ai-agents-teams/{address}/{id}/published`.
 */
export type PublishedState = {
  /**
   * Whether the account the chain names still exists on its PDS.
   *
   * Three-valued on purpose. `false` is a real divergence -- a publication whose
   * account has been destroyed, which is what wiping a development PDS leaves
   * behind. `null` means the question could not be answered, from an unreachable
   * PDS or a publish recorded before handles were captured, and must not be shown
   * as though the account were missing.
   */
  account_exists: boolean | null;
  /**
   * Whether the publication is currently in force -- whether the account still
   * carries the record that makes f1r3sky treat its handle as a team. Mentions fire
   * only while it is present, and unpublishing removes it while keeping the account.
   */
  active: boolean | null;
  did: string | null;
  handle: string | null;
  /**
   * Whether the published deployment is still the team's newest.
   *
   * `false` means a mention runs an older build than the editor shows, because a
   * deploy mints a new registry uri while the published record keeps naming the old
   * one.
   */
  is_latest_deployment: boolean;
  published_version: string;
  uri: string;
};
