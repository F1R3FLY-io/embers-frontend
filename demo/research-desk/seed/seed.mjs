#!/usr/bin/env node
// Research Desk demo seeder.
//
// Drives the Embers backend through the client SDK to prepare every on-chain
// asset the demo needs. Subcommands (combine freely):
//
//   node seed.mjs --smoke    deploy the three smoke .rho files and assert PASS
//   node seed.mjs --corpus   seed the embers-demo-docs ChromaDB collection
//   node seed.mjs --agents   create + deploy the Researcher, Critic, and Archivist agents
//   node seed.mjs --team     create/save + deploy the backup team from the fixture
//   node seed.mjs --all      corpus, smoke, agents, team in dependency order
//
// Options:
//   --run-dir <path>    the stack profile's run directory holding wallet/ and
//                       val.log. Default resolution order: this flag, the
//                       EMBERS_STACK_RUN_DIR environment variable (the same
//                       one stack.sh honors), /tmp/embers-agent-teams-stable-run
//                       when it exists (the stable customer-demo profile),
//                       then <sibling embers-local-stack>/run.
//   --api <url>         backend base path (default: http://[::1]:8080)
//
// The wallet key is read from <run-dir>/wallet/*.json (the genesis-funded
// demo wallet printed by stack.sh). It is never logged. Deploy state (agent ids,
// team id, registry key, team URI) is written to .last-deploy.json beside this
// script so re-runs reuse the same team; that file is gitignored because it
// holds the demo registry private key.
//
// The SDK is imported from packages/client/dist, so build it first if missing:
//   pnpm --filter @f1r3fly-io/embers-client-sdk build

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const demoDir = resolve(scriptDir, "..");
const repoRoot = resolve(demoDir, "..", "..");
const sdkEntry = join(
  repoRoot,
  "packages/client/dist/embers-client-sdk.es.js",
);

if (!existsSync(sdkEntry)) {
  console.error(
    `Client SDK build not found at ${sdkEntry}.\n` +
      "Build it first: pnpm --filter @f1r3fly-io/embers-client-sdk build",
  );
  process.exit(1);
}

const { EmbersApiSdk, PrivateKey, Uri } = await import(sdkEntry);

const { values: args } = parseArgs({
  options: {
    all: { type: "boolean", default: false },
    agents: { type: "boolean", default: false },
    api: { type: "string", default: "http://[::1]:8080" },
    corpus: { type: "boolean", default: false },
    "run-dir": { type: "string" },
    smoke: { type: "boolean", default: false },
    team: { type: "boolean", default: false },
  },
});

if (!args.all && !args.smoke && !args.corpus && !args.agents && !args.team) {
  console.error(
    "Nothing to do. Pass --all or any of --smoke --corpus --agents --team.",
  );
  process.exit(1);
}

function resolveRunDir() {
  const candidates = [
    args["run-dir"],
    process.env.EMBERS_STACK_RUN_DIR,
    "/tmp/embers-agent-teams-stable-run",
    resolve(repoRoot, "..", "embers-local-stack", "run"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "wallet"))) {
      return candidate;
    }
  }
  throw new Error(
    `No stack run directory with a wallet/ found among: ${candidates.join(", ")}. ` +
      "Is the stack initialized (./stack.sh up)? Pass --run-dir explicitly if needed.",
  );
}

const runDir = resolveRunDir();
console.log(`Stack run directory: ${runDir}`);
const stateFile = join(scriptDir, ".last-deploy.json");

function loadWalletKey() {
  const walletDir = join(runDir, "wallet");
  const files = readdirSync(walletDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(join(walletDir, file), "utf8"));
    if (parsed.value && parsed.valueFormat === "hex") {
      return PrivateKey.tryFromHex(parsed.value);
    }
  }
  throw new Error(
    `No hex wallet key found in ${walletDir} (expected {keyType, value, valueFormat: "hex"}).`,
  );
}

function loadState() {
  return existsSync(stateFile)
    ? JSON.parse(readFileSync(stateFile, "utf8"))
    : {};
}

function saveState(patch) {
  const next = { ...loadState(), ...patch };
  writeFileSync(stateFile, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function sleep(millis) {
  return new Promise((done) => setTimeout(done, millis));
}

// Deploy a .rho file through the testnet endpoint. The send response executes
// the deploy synchronously and returns the messages the code emitted to the
// on-chain test log contract, so the marker is asserted directly from the
// HTTP response -- no validator-log polling.
async function deployRhoAndAwaitMarker(sdk, key, rhoPath, marker) {
  const code = readFileSync(rhoPath, "utf8");
  console.log(`Deploying ${rhoPath} ...`);
  let result;
  try {
    result = await sdk.testnet.deploy(key, code);
  } catch (error) {
    if (error && typeof error === "object" && "response" in error) {
      const { response } = error;
      const body = await response.text().catch(() => "<unreadable>");
      throw new Error(
        `Deploy of ${rhoPath} rejected: HTTP ${response.status} ${body}`,
      );
    }
    throw error;
  }
  if (result.type !== "Ok") {
    throw new Error(
      `Deploy of ${rhoPath} failed on chain: ${JSON.stringify(result)}`,
    );
  }
  const line = (result.logs ?? [])
    .map((log) => log.message)
    .find((message) => message.includes(marker));
  if (!line) {
    throw new Error(
      `Deploy of ${rhoPath} returned no ${marker} log. Logs: ${JSON.stringify(result.logs)}`,
    );
  }
  return line;
}

function assertLineContains(line, needle, hint) {
  if (!line.includes(needle)) {
    throw new Error(`Smoke FAILED: marker line lacks "${needle}". ${hint}\n${line}`);
  }
  console.log(`PASS: found "${needle}"`);
}

// Model summaries vary, so grounded-answer checks accept any corpus-domain
// term rather than one exact word.
function assertLineContainsAny(line, needles, hint) {
  const found = needles.find((needle) => line.toLowerCase().includes(needle));
  if (!found) {
    throw new Error(
      `Smoke FAILED: marker line lacks all of ${JSON.stringify(needles)}. ${hint}\n${line}`,
    );
  }
  console.log(`PASS: found "${found}"`);
}

// Await the deploy's finalization event. When only the observer's
// confirmation times out (the deploy itself was accepted), follow the error
// message's own instruction: verify the on-chain record instead of retrying
// blindly. `verify` polls the authoritative record and returns true once the
// mutation is visible.
async function awaitFinalizationOrVerify(label, result, verify) {
  console.log(`${label}: sent, awaiting finalization ...`);
  try {
    await result.waitForFinalization;
    console.log(`${label}: finalized`);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("finalization confirmation timed out") || !verify) {
      throw error;
    }
    console.log(`${label}: observer confirmation timed out; verifying the record ...`);
  }
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (await verify()) {
      console.log(`${label}: verified via record`);
      return;
    }
    await sleep(5000);
  }
  throw new Error(
    `${label}: deploy was accepted but the record did not become visible within the verification window.`,
  );
}

function timestampOf(value) {
  return value ? new Date(value).getTime() : null;
}

async function ensureAgent(sdk, name, rhoPath, description) {
  const findAgent = async () =>
    (await sdk.agents.get()).agents.find((header) => header.name === name);

  const code = readFileSync(rhoPath, "utf8");
  let existing = await findAgent();
  let id;
  let version;
  if (existing) {
    ({ id, version } = existing);
    const onChain = await sdk.agents.getVersion(id, version);
    if (onChain.code === code) {
      console.log(
        `Agent ${name} exists with identical code (id ${id}, version ${version}); redeploying that version.`,
      );
    } else {
      console.log(
        `Agent ${name} exists but the local code differs; saving a new version.`,
      );
      const saved = await sdk.agents.save(id, { code, description, name });
      version = saved.prepareResponse.response.version;
      if (!version) {
        throw new Error(
          `agents.save(${name}): the prepare response carried no version.`,
        );
      }
      await awaitFinalizationOrVerify(`agents.save(${name})`, saved, async () => {
        try {
          await sdk.agents.getVersion(id, version);
          return true;
        } catch {
          return false;
        }
      });
      existing = await findAgent();
    }
  } else {
    const created = await sdk.agents.create({ code, description, name });
    ({ id, version } = created.prepareResponse.response);
    await awaitFinalizationOrVerify(
      `agents.create(${name})`,
      created,
      async () => (await findAgent()) !== undefined,
    );
    existing = await findAgent();
  }

  const lastDeployBefore = timestampOf(existing?.lastDeploy);
  const deployed = await sdk.agents.deploy(id, version);
  await awaitFinalizationOrVerify(
    `agents.deploy(${name})`,
    deployed,
    async () => {
      const header = await findAgent();
      const lastDeployAfter = timestampOf(header?.lastDeploy);
      return lastDeployAfter !== null && lastDeployAfter !== lastDeployBefore;
    },
  );
  return { id, version };
}

async function main() {
  const privateKey = loadWalletKey();
  const sdk = new EmbersApiSdk({ basePath: args.api, privateKey });
  console.log(`Wallet address: ${sdk.agents.address.value ?? sdk.agents.address}`);

  const runCorpus = args.all || args.corpus;
  const runSmoke = args.all || args.smoke;
  const runAgents = args.all || args.agents;
  const runTeam = args.all || args.team;

  if (runSmoke) {
    const line00 = await deployRhoAndAwaitMarker(
      sdk,
      privateKey,
      join(demoDir, "smoke", "00-chroma-live.rho"),
      "EMBERS-SMOKE-00-RESULT",
    );
    assertLineContains(
      line00,
      "purple dragonflies",
      "ChromaDB is NoOp or the node lacks the chromadb feature.",
    );
    const line01 = await deployRhoAndAwaitMarker(
      sdk,
      privateKey,
      join(demoDir, "smoke", "01-gpt4-live.rho"),
      "EMBERS-SMOKE-01-RESULT",
    );
    assertLineContains(
      line01,
      "PONG",
      "The OpenAI service is disabled or the key is invalid.",
    );
  }

  if (runCorpus) {
    await deployRhoAndAwaitMarker(
      sdk,
      privateKey,
      join(demoDir, "seed", "seed-corpus.rho"),
      "EMBERS-DEMO-SEED-OK",
    );
    console.log("PASS: corpus seeded into embers-demo-docs");
  }

  if (runSmoke) {
    const line02 = await deployRhoAndAwaitMarker(
      sdk,
      privateKey,
      join(demoDir, "smoke", "02-rag-roundtrip.rho"),
      "EMBERS-SMOKE-02-RESULT",
    );
    assertLineContainsAny(
      line02,
      ["progress", "cycle", "boundary", "wait", "bounded"],
      "RAG roundtrip returned no grounded answer. Seed the corpus first (--corpus).",
    );
  }

  if (runAgents) {
    const researcher = await ensureAgent(
      sdk,
      "research-desk-researcher",
      join(demoDir, "agents", "researcher.rho"),
      "Retrieves context from ChromaDB and drafts grounded answers with gpt4.",
    );
    const critic = await ensureAgent(
      sdk,
      "research-desk-critic",
      join(demoDir, "agents", "critic.rho"),
      "Scores drafts for faithfulness with a fixed-token gpt4 rubric.",
    );
    const archivist = await ensureAgent(
      sdk,
      "research-desk-archivist",
      join(demoDir, "agents", "archivist.rho"),
      "Archives human-approved answers from the escalation gate into embers-demo-docs.",
    );
    saveState({ archivist, critic, researcher });
    console.log(
      `Agents ready: researcher ${researcher.id}@${researcher.version}, critic ${critic.id}@${critic.version}, archivist ${archivist.id}@${archivist.version}`,
    );
  }

  if (runTeam) {
    const state = loadState();
    if (!state.researcher || !state.critic || !state.archivist) {
      throw new Error("Run --agents before --team (agent pins are required).");
    }
    const template = readFileSync(
      join(demoDir, "team", "research-desk.workflow.json"),
      "utf8",
    );
    const definition = JSON.parse(
      template
        .replaceAll("__RESEARCHER_AGENT_ID__", state.researcher.id)
        .replaceAll("__RESEARCHER_AGENT_VERSION__", state.researcher.version)
        .replaceAll("__CRITIC_AGENT_ID__", state.critic.id)
        .replaceAll("__CRITIC_AGENT_VERSION__", state.critic.version)
        .replaceAll("__ARCHIVIST_AGENT_ID__", state.archivist.id)
        .replaceAll("__ARCHIVIST_AGENT_VERSION__", state.archivist.version),
    );
    const teamReq = {
      definition,
      description:
        "On-chain RAG research desk: draft, critique, bounded revise loop, human escalation gate, and a knowledge-loop archivist that files human-approved answers.",
      name: "Research Desk",
    };

    const teamVersionVisible = async (id, version) => {
      try {
        await sdk.agentsTeams.getVersion(id, version);
        return true;
      } catch {
        return false;
      }
    };
    const findTeamHeader = async (id) =>
      (await sdk.agentsTeams.get()).agentsTeams.find(
        (header) => header.id === id,
      );

    let teamId = state.teamId;
    if (teamId && !(await findTeamHeader(teamId))) {
      // A chain reset leaves .last-deploy.json pointing at ids the current
      // chain never saw; reusing them "saves" into an unreachable orphan and
      // the deploy then fails with "agents team not found". Fall back to the
      // by-name path, which creates the team fresh.
      console.log(
        `Recorded team id ${teamId} does not exist on this chain (reset?); recreating by name.`,
      );
      teamId = undefined;
    }
    if (!teamId) {
      const existingTeam = (await sdk.agentsTeams.get()).agentsTeams.find(
        (header) => header.name === "Research Desk",
      );
      if (existingTeam) {
        console.log(
          `Team Research Desk already exists (id ${existingTeam.id}); saving a new version instead of creating a duplicate.`,
        );
        teamId = existingTeam.id;
      }
    }
    let teamVersion;
    if (teamId) {
      const saved = await sdk.agentsTeams.save(teamId, teamReq);
      teamVersion = saved.prepareResponse.response.version;
      await awaitFinalizationOrVerify("agentsTeams.save", saved, () =>
        teamVersionVisible(teamId, teamVersion),
      );
    } else {
      const created = await sdk.agentsTeams.create(teamReq);
      teamId = created.prepareResponse.response.id;
      teamVersion = created.prepareResponse.response.version;
      await awaitFinalizationOrVerify("agentsTeams.create", created, () =>
        teamVersionVisible(teamId, teamVersion),
      );
    }

    const teamHeaderBefore = await findTeamHeader(teamId);
    const lastDeployBefore = timestampOf(teamHeaderBefore?.lastDeploy);
    const registryKey = PrivateKey.new();
    const deployed = await sdk.agentsTeams.deploy(
      teamId,
      teamVersion,
      1n,
      registryKey,
    );
    await awaitFinalizationOrVerify("agentsTeams.deploy", deployed, async () => {
      const header = await findTeamHeader(teamId);
      const lastDeployAfter = timestampOf(header?.lastDeploy);
      return lastDeployAfter !== null && lastDeployAfter !== lastDeployBefore;
    });
    const uri = Uri.fromPublicKey(registryKey.getPublicKey()).value;
    saveState({
      registryKeyHex: registryKey.toHex(),
      teamId,
      teamUri: uri,
      teamVersion,
    });
    console.log(`Team deployed: id ${teamId}@${teamVersion}`);
    console.log(`Team URI: ${uri}`);
  }

  console.log("Done.");
}

main()
  .then(() => {
    // The SDK's finalization-events WebSocket keeps the event loop alive
    // after the work completes; exit explicitly on both paths.
    process.exit(0);
  })
  .catch(async (error) => {
    if (error && typeof error === "object" && "response" in error) {
      const { response } = error;
      const body = await response.text().catch(() => "<unreadable>");
      console.error(`HTTP ${response.status} ${response.url ?? ""}: ${body}`);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exit(1);
  });
