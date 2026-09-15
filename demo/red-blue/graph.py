"""Shared graph builder for the red/blue seeder and chain acceptance tests."""

import json
from pathlib import Path

DEFINITION = json.loads(Path(__file__).with_name("graph.json").read_text())


def build_definition(agents: dict[str, tuple[str, str]]) -> dict:
    nodes = {
        "Input": {"id": "Input", "label": "Input", "outputKey": "input", "kind": "input", "scopeId": "root"},
        "Output": {"id": "Output", "label": "Output", "kind": "output", "scopeId": "root"},
    }
    for name in DEFINITION["agents"]:
        node = {"id": name, "label": name, "outputKey": name[0].lower() + name[1:], "kind": "activity", "scopeId": "root",
                "activity": {"kind": "agent", "agentId": agents[name][0], "agentVersion": agents[name][1], "protocol": "structured-v1"}}
        if name == "ReviewCoverage":
            node["join"] = {"mode": "all", "correlation": {"kind": "routeGroup", "routeGroupId": "ConstraintCheck"}}
        elif name in ("ConstraintCheck", "DecisionWriter"):
            node["join"] = {"mode": "each", "correlation": {"kind": "root"}}
        nodes[name] = node
    nodes["Decide"] = {"id": "Decide", "label": "Decide", "kind": "gateway", "scopeId": "root"}
    nodes["Limit"] = {"id": "Limit", "label": "Review limit", "kind": "gateway", "scopeId": "root"}
    routes = {source: {"id": source, "mode": "allMatches", "noMatch": "fail"} for source, _ in DEFINITION["edges"]}
    routes["Decide"]["mode"] = "firstMatch"
    routes["Decide-limit"] = {"id": "Decide-limit", "mode": "allMatches", "noMatch": "fail"}
    transitions = {f"edge-{i}": {"id": f"edge-{i}", "sourceNodeId": source,
                   "targetNodeId": target, "trigger": "completed", "priority": 0, "routeGroupId": source}
                   for i, (source, target) in enumerate(DEFINITION["edges"])}
    transitions["edge-9"]["guard"] = {"kind": "compare", "left": {"kind": "path", "root": "output", "path": ["outcome"]}, "operator": "ne", "right": {"kind": "literal", "value": "revise"}}
    transitions["edge-10"].update(priority=1, loop={"maxIterations": 2})
    transitions["edge-11"].update(trigger="iterationLimit", routeGroupId="Decide-limit")
    return {"schemaVersion": "2.0", "entryScopeId": "root", "nodes": nodes, "routeGroups": routes,
            "transitions": transitions, "scopes": {"root": {"id": "root", "label": "RedBlueDecisionReview",
            "kind": "root", "initialNodeIds": ["Input"], "entryActivities": [], "exitActivities": [], "history": "none"}},
            "interface": {"inputs": {"input": {"kind": "string"}}, "outputs": {"output": {"kind": "legacy"}}},
            "types": {}, "policies": {"defaultExecution": "bounded", "visibility": "private"},
            "deploymentContainers": {"ReviewDeployment": {"id": "ReviewDeployment", "label": "Engineering decision review", "target": "current", "nodeIds": list(DEFINITION["agents"])}},
            "presentation": {"nodes": {}, "edges": {}}}
