/**
 * How a team's publication to F1R3SKY stands, as reported by
 * `GET /ai-agents-teams/{address}/{id}/published`.
 *
 * Declared here rather than in the generated API client: that client is
 * hand-extended and regenerating it would discard those edits, so this endpoint is
 * read directly and its shape is described alongside the code that reads it.
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
