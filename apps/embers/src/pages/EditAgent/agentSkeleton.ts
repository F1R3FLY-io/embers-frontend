/**
 * Starting point for a brand new agent.
 *
 * The editor opens blank otherwise, which leaves the contract between an agent
 * and the Agent Team runtime entirely implicit — and the failure modes are
 * quiet ones: an agent that never replies just hangs the team, and a quoted
 * contract name collides with other agents instead of erroring. So the skeleton
 * spells out the rules and ships a body that runs unmodified.
 */

/** `"Summarize"` -> `"summarize_agent.rho"`; blank -> `"new_agent.rho"`. */
export function agentDocumentName(name?: string): string {
  const slug = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${slug === "" ? "new" : slug}_agent.rho`;
}

export function agentSkeleton(name?: string): string {
  const title = (name ?? "").trim() === "" ? "New" : name!.trim();

  return `// ${title} agent.
//
// Define your agent as a single \`main\` contract. The Agent Team runtime calls
// it once per run:
//   input  - one incoming edge:  the upstream value itself.
//            two or more edges:  a Map (see "Multiple inputs" below).
//   return - send your result here exactly once:  return!(result)
//            (sending twice is nondeterministic; only one value propagates)
//
// Rules:
//   * The entry contract MUST be named \`main\`. (\`agent\` is a reserved word in
//     Rholang and will not parse.)
//   * Do NOT use a quoted name like \`contract @"myAgent"(...)\`. Quoted names are
//     global, so two agents in one team would collide.
//   * Declare every channel you use with \`new\` - free names are rejected by the
//     node ("Top level free variables are not allowed").
//   * If you never send to \`return\`, the team hangs with no output.
//
// ---------------------------------------------------------------------------
// Multiple inputs
// ---------------------------------------------------------------------------
// Wire two or more nodes into this agent and \`input\` becomes a Map, keyed by
// each upstream node's name ("textModel", "ttiModel", "ttsModel", "compress",
// or another agent's name; duplicates get a numeric suffix: "textModel2").
// Replace the contract below with this shape:
//
//   contract main(@input, return) = {
//     new gpt4(\`rho:ai:gpt4\`) in {
//       gpt4!(
//         "Write one caption for: " ++ input.get("ttiModel") ++
//         "\\nTone: " ++ input.get("textModel"),
//         *return
//       )
//     }
//   }
//
// All inputs arrive together - the runtime waits for one value from every
// incoming edge before calling \`main\`.
// ---------------------------------------------------------------------------

contract main(@input, return) = {
  new gpt4(\`rho:ai:gpt4\`) in {
    gpt4!("Summarize the following text in one vivid sentence. Reply with only the summary: " ++ input, *return)
  }
}
`;
}
