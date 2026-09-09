"""Shared graph builder for the red/blue seeder and chain acceptance tests."""

import json
from pathlib import Path

DEFINITION = json.loads(Path(__file__).with_name("graph.json").read_text())


def build_definition(agents: dict[str, tuple[str, str]]) -> dict:
    nodes = {
        "Input": {"id": "Input", "label": "input-node", "kind": "input", "scopeId": "root"},
        "Output": {"id": "Output", "label": "Output", "kind": "output", "scopeId": "root"},
    }
    for name in DEFINITION["agents"]:
        node = {"id": name, "label": name, "kind": "activity", "scopeId": "root",
                "activity": {"kind": "agent", "agentId": agents[name][0], "agentVersion": agents[name][1], "protocol": "simple-v1"}}
        if sum(target == name for _, target in DEFINITION["edges"]) > 1:
            node["join"] = {"mode": "all", "correlation": {"kind": "root"}}
        nodes[name] = node
    routes = {source: {"id": source, "mode": "allMatches", "noMatch": "fail"} for source, _ in DEFINITION["edges"]}
    transitions = {f"{source}-{target}": {"id": f"{source}-{target}", "sourceNodeId": source,
                   "targetNodeId": target, "trigger": "completed", "priority": 0, "routeGroupId": source}
                   for source, target in DEFINITION["edges"]}
    return {"schemaVersion": "2.0", "entryScopeId": "root", "nodes": nodes, "routeGroups": routes,
            "transitions": transitions, "scopes": {"root": {"id": "root", "label": "RedBlueDecisionReview",
            "kind": "root", "initialNodeIds": ["Input"], "entryActivities": [], "exitActivities": [], "history": "none"}},
            "interface": {"inputs": {"input": {"kind": "string"}}, "outputs": {"output": {"kind": "legacy"}}},
            "types": {}, "policies": {"defaultExecution": "bounded", "visibility": "private"},
            "presentation": {"nodes": {}, "edges": {}}}
