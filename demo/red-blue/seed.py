"""Seed or rehearse the live red/blue demo with the Embers integration client."""

import argparse
import json
import os
import sys
from datetime import UTC, datetime
from pathlib import Path

DEMO_DIR = Path(__file__).resolve().parent
WORKSPACE = DEMO_DIR.parents[2]
sys.path.insert(0, str(WORKSPACE / "embers/packages/embers"))

from graph import DEFINITION, build_definition
from tests.client import AgentsTeam, ApiClient, Wallet
from tests.conftest import insert_signed_deploy
from tests.key import SECP256k1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", action="store_true", help="Create eight agents and a new RedBlueDecisionReview deployment")
    query = parser.add_mutually_exclusive_group()
    query.add_argument("--query", help="Run a query through the saved team (calls the configured model)")
    query.add_argument("--brief-file", type=Path, help="Read the complete query from a text file")
    parser.add_argument("--api", default="[::1]:8080", help="Embers host:port, without http://")
    parser.add_argument(
        "--run-dir",
        type=Path,
        default=Path(os.environ.get("EMBERS_STACK_RUN_DIR", WORKSPACE / "embers-local-stack/run/profiles/research-desk")),
    )
    args = parser.parse_args()
    if args.brief_file is not None:
        args.query = args.brief_file.read_text()
    if not args.seed and args.query is None:
        parser.error("Pass --seed, --query, --brief-file, or seed plus a query")

    address = (args.run_dir / "wallet/address.txt").read_text().strip()
    key_data = json.loads((args.run_dir / "wallet" / f"{address}.json").read_text())
    wallet = Wallet(SECP256k1.from_hex(key_data["value"]))
    client = ApiClient(args.api)
    state_path = args.run_dir / "red-blue-demo.json"

    if args.seed:
        client.wallets.listen_for_deploys(wallet)
        agents = {}
        for name in DEFINITION["agents"]:
            result = client.agents.create(
                wallet, name=f"RedBlueBackup-{name}", code=(DEMO_DIR / "agents" / f"{name}.rho").read_text()
            ).wait_for_sync()
            record = result.first.json["response"]
            agents[name] = (record["id"], record["version"])
            print(f"Created {name}", flush=True)
        definition = build_definition(agents)
        result = client.agents_teams.create(wallet, name="RedBlueDecisionReview", definition=definition).wait_for_sync()
        record = result.first.json["response"]
        team = AgentsTeam(id=record["id"], version=record["version"], name="RedBlueDecisionReview", definition=definition)
        client.agents_teams.deploy(
            wallet,
            agents_team=team,
            deploy=insert_signed_deploy(SECP256k1.generate(), datetime.now(UTC), wallet, version=0),
        ).wait_for_sync()
        uri = client.agents_teams.get(wallet.address, team.id, team.version).json["uri"]
        assert uri, "Team deployment did not record a URI"
        state = {"teamId": team.id, "teamVersion": team.version, "teamUri": uri, "agents": agents}
        state_path.write_text(json.dumps(state, indent=2) + "\n")
        print(f"Deployed RedBlueDecisionReview: {uri}\nState: {state_path}", flush=True)

    if args.query is not None:
        state = json.loads(state_path.read_text())
        answer = client.agents_teams.run(wallet, args.query, agents_team=state["teamUri"], timeout=600).json
        if not isinstance(answer, str) or not answer.strip():
            raise RuntimeError(f"Expected a non-empty final answer, received: {answer!r}")
        print(answer, flush=True)


if __name__ == "__main__":
    main()
