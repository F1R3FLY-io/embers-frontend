# Red/blue engineering decision demo

Build **RedBlueDecisionReview-live** during the demonstration. Six model agents propose, challenge, revise, and summarize an engineering policy. Two local Rholang agents calculate review capacity and emergency-review feasibility. All eight agents belong to a real deployment container on the current stack. Input and Output remain outside it.

## Before presenting

Follow the [shared stack runbook](customer-demo-runbook.md). Run `./stack.sh status` from `embers-local-stack`: both nodes, the proposer, persistent F1r3drive, and Embers must be running. Open <http://localhost:5173> and unlock the funded presenter wallet before screen sharing. Keep wallet private keys off screen.

Run the integration checks sequentially with rehearsals:

```sh
cd ~/Workspace/f1r3fly.io/embers/packages/embers
uv run pytest tests/api/agents_teams/test_red_blue_demo.py -v --strict-services
uv run python ../../../embers-frontend/demo/red-blue/seed.py --seed \
  --brief-file ../../../embers-frontend/demo/red-blue/brief.txt
```

The deterministic scenarios cover a flawed proposal, an acceptable proposal, missing facts, and execution through nested deployment containers. The seeder uses real model calls and creates backup agents prefixed `RedBlueBackup-`; each `--seed` creates a new team. Later CLI queries can reuse the profile's `red-blue-demo.json` by omitting `--seed`. The default profile is `embers-local-stack/run/profiles/research-desk`; use `--run-dir` to select another.

## Explain the decision and assumptions

“We want a useful review policy for five engineers. Blue proposes a plan; red challenges it. Two ordinary Rholang contracts supply explicit arithmetic, then blue revises the plan and explains unresolved risks.”

The deliberately flawed proposal requires two approvals even for urgent production fixes. The brief specifies five engineers, one on call, existing pull requests and CI, and no tooling budget. Review turnaround and incident frequency are unknown.

The calculator assumptions are edited in the Rholang source before saving the agents. They are demonstration scenarios, not measurements extracted from arbitrary prose. Explain this distinction when the query describes another organization.

| Agent | Editable assumptions | Default result |
| --- | --- | --- |
| ReviewCapacity | 5 engineers, 1 reserved on call, 60 review minutes per remaining engineer/day, 6 PR/day, 30 minutes/review | 240 minutes capacity. Two approvals: 360 minutes, 150%, at most 4 PR/day. One approval: 180 minutes, 75%, at most 8 PR/day. |
| EmergencyReviewPolicy | 1 available independent reviewer, 10 minutes/review, 15-minute deadline; reviews can run in parallel | Two approvals: deficit 1, zero reviewer pairs, infeasible. One: deficit 0, one choice, feasible. |

The second calculator counts distinct reviewer pairs as `n*(n-1)/2`; authors are excluded from the available independent reviewers. Neither calculator authorizes an emergency bypass. Percentages and daily capacity use integer arithmetic. Validate altered assumptions with another rehearsal.

The model agents may use general engineering knowledge. They distinguish that knowledge from the brief, calculations, and assumptions. The configured model channel has no live web-retrieval tool: they must not fabricate citations or claim current Internet verification.

## Create the eight agents live

From the dashboard, create each agent below. Wait for its editor to load, replace the entire body with the corresponding source in the appendix, choose **Save changes**, and wait for confirmation. Keep `contract main(@input, return)` and the `simple-v1` protocol.

| Agent name | Role | Output key in the team |
| --- | --- | --- |
| ReviewCapacity | Compute daily review capacity locally | `reviewCapacity` |
| EmergencyReviewPolicy | Compute independent-reviewer feasibility locally | `emergencyReviewPolicy` |
| BluePlanner | Propose the initial policy using the brief and calculations | `bluePlanner` |
| RedLogic | Challenge internal consistency | `redLogic` |
| RedEvidence | Challenge unsupported claims and missing evidence | `redEvidence` |
| RedOperations | Challenge staffing, incident response, and rollout feasibility | `redOperations` |
| BlueResponder | Address every red finding with CHANGE, MITIGATE, or ACCEPT RISK | `blueResponder` |
| DecisionWriter | Produce the final decision brief | `decisionWriter` |

The output key is stable and separate from the displayed name. Confirm the keys in node configuration; Input uses `input`. Renaming a label must not change what downstream contracts read. Sources deliberately use one canonical key such as `input.getOrElse("input", Nil)` instead of aliases. A single upstream value is delivered directly; nodes joining multiple incoming routes receive a map indexed by these keys.

## Draw the team

Create a team named **RedBlueDecisionReview-live**. Add Input, all eight saved agents, and Output. Configure agent nodes with `simple-v1` and the output keys above. Arrange the two calculators after Input, then BluePlanner, the three critics, BlueResponder, DecisionWriter, and Output.

Connect the right output handle to the destination's left input handle:

| Source | Targets | Edges |
| --- | --- | ---: |
| Input | BluePlanner, RedLogic, RedEvidence, RedOperations, BlueResponder, DecisionWriter, ReviewCapacity, EmergencyReviewPolicy | 8 |
| ReviewCapacity | BluePlanner, RedOperations, BlueResponder, DecisionWriter | 4 |
| EmergencyReviewPolicy | BluePlanner, RedOperations, BlueResponder, DecisionWriter | 4 |
| BluePlanner | RedLogic, RedEvidence, RedOperations, BlueResponder | 4 |
| RedLogic | BlueResponder | 1 |
| RedEvidence | BlueResponder | 1 |
| RedOperations | BlueResponder | 1 |
| BlueResponder | DecisionWriter | 1 |
| DecisionWriter | Output | 1 |

**Checkpoint:** 10 functional nodes and 25 edges. Use successful routes and wait-for-all joins for nodes with multiple inputs: BluePlanner has 3, RedLogic and RedEvidence 2 each, RedOperations 4, BlueResponder 7, DecisionWriter 4. The two calculators each have one input. Compare with [graph.json](../../../demo/red-blue/graph.json).

This demonstration uses one review round. Embers still supports cycles and hierarchical state scopes; they are not needed to present this policy review.

## Create and deploy the container

1. Click an empty part of the canvas to clear the current selection. Hold **Shift**, click and drag a selection region around the eight agent nodes. Leave Input and Output outside the selection.
2. Right-click the selected region and choose **Add to deploy container**.
3. Name the container **Engineering decision review**. Move or resize its boundary as needed. Confirm all eight members and all 25 edges remain present.
4. Save the team, choose **Deploy**, review it, and confirm deployment. Wait for success before choosing **Run**.

A deploy container packages its member code into a separately registered Rholang contract with its own URI. The team dispatches those activities through the container. Containers finalize before the team's deployment and its deployment record. This implementation targets the current stack; it does not route work to another hardware target.

**Wrap in state scope** is a separate context-menu action for workflow entry/exit, history, and lifecycle. Use it when you want those semantics. Unwrapping a deploy container retains its members and graph connections.

## Run and inspect

Choose **Run**, paste [brief.txt](../../../demo/red-blue/brief.txt), and submit. Allow the model calls and finalized activities to complete. The final response ends with calculator evidence copied directly from both Rholang outputs, alongside four model-written sections: **Recommendation**, **Changes after review**, **Remaining risks**, and **Rollout checklist**. Ask what changed after the review, and point to calculator-backed staffing or emergency constraints. Do not promise identical prose between rehearsals.

Open the run page with the presenter wallet. Unlock the agent history to inspect each executed agent's recorded output; calculator results are structured values. Execution occurrences remain distinct when a workflow contains loops or repeated visits. Reveal the full final response to show the decision brief.

For another query, ask for a rollout policy, a staffing tradeoff, an incident-review procedure, or a decision under explicit constraints. If calculator assumptions differ from the query, edit and redeploy them or explicitly request a comparison to the fixed scenario. Do not represent the scenario numbers as measured facts.

## Publish to F1r3sky

Publication is separate from deployment. With a deployed team, choose publication to F1r3sky. The local PDS is `http://localhost:2583` (Personal Data Server); the UI should prefill it from configuration. The handle defaults from the team name with the PDS's suffix, normally `.test`. The generated demo email follows the handle until manually edited. Email and password create the team's PDS account; the account's app password lets Embers publish its team record. They are not the presenter wallet.

After successful publication, use the popup's link to F1r3sky (<http://localhost:19006>) and mention the team with a decision query. Back in Embers the completed form offers **Close**. See [publication and agent history](publication-and-agent-history.md).

## If something fails

- Check the output keys and the 25 edges before changing agent code. Confirm all eight agents were saved, and deployment completed.
- A model timeout calls for checking the configured model service and the stack logs. The calculators themselves require no model or external service.
- Logs are in `embers-local-stack/run/profiles/research-desk/embers.log`, `val.log`, `read.log`, and `f1r3drive.log`.
- A missing historical continuation does not require a stack reset. Recovery scans skip terminal runs and report active failures by run ID; unavailable historical artifacts still require their original storage to view.
- Use the pre-rehearsed backup deployment if presentation time is short.

## Agent sources

These blocks match the authoritative files under [demo/red-blue/agents](../../../demo/red-blue/agents). Paste the entire block for each agent.

### ReviewCapacity

Source: [ReviewCapacity.rho](../../../demo/red-blue/agents/ReviewCapacity.rho)

```rholang
contract main(@input, return) = {
  new calculate in {
    // Editable demonstration assumptions, not measurements inferred from the query.
    calculate!(5, 1, 60, 6, 30, *return) |
    contract calculate(@engineers, @reservedOnCall, @minutesPerEngineer, @pullRequests, @minutesPerReview, out) = {
      if (engineers <= reservedOnCall or reservedOnCall < 0 or minutesPerEngineer <= 0 or pullRequests < 0 or minutesPerReview <= 0) {
        out!({"error": "Invalid review capacity assumptions", "summary": "Review capacity assumptions must provide positive available capacity and review duration."})
      } else {
        match (engineers - reservedOnCall) * minutesPerEngineer {
          capacity => {
            out!({
              "assumptions": {"engineers": engineers, "reservedOnCall": reservedOnCall, "minutesPerEngineerPerDay": minutesPerEngineer, "pullRequestsPerDay": pullRequests, "minutesPerReview": minutesPerReview},
              "capacityMinutesPerDay": capacity,
              "proposed": {"approvals": 2, "demandMinutesPerDay": pullRequests * minutesPerReview * 2, "utilizationPercent": pullRequests * minutesPerReview * 200 / capacity, "maxPullRequestsPerDay": capacity / (minutesPerReview * 2)},
              "alternative": {"approvals": 1, "demandMinutesPerDay": pullRequests * minutesPerReview, "utilizationPercent": pullRequests * minutesPerReview * 100 / capacity, "maxPullRequestsPerDay": capacity / minutesPerReview},
              "summary": "Scenario assumptions, not measured facts: ${capacity} review minutes/day; two approvals require ${twoDemand} minutes/day (${twoPercent}% utilization), supporting at most ${twoMax} PR/day; one approval requires ${oneDemand} minutes/day (${onePercent}% utilization), supporting at most ${oneMax} PR/day." %% {"capacity": capacity, "twoDemand": pullRequests * minutesPerReview * 2, "twoPercent": pullRequests * minutesPerReview * 200 / capacity, "twoMax": capacity / (minutesPerReview * 2), "oneDemand": pullRequests * minutesPerReview, "onePercent": pullRequests * minutesPerReview * 100 / capacity, "oneMax": capacity / minutesPerReview}
            })
          }
        }
      }
    }
  }
}
```

### EmergencyReviewPolicy

Source: [EmergencyReviewPolicy.rho](../../../demo/red-blue/agents/EmergencyReviewPolicy.rho)

```rholang
contract main(@input, return) = {
  new calculate in {
    // Independent reviewers exclude the author; reviews can run in parallel.
    // Editable scenario assumptions, not a claim about actual incident coverage.
    calculate!(1, 10, 15, *return) |
    contract calculate(@reviewers, @reviewMinutes, @deadlineMinutes, out) = {
      if (reviewers < 0 or reviewMinutes <= 0 or deadlineMinutes <= 0) {
        out!({"error": "Invalid emergency review assumptions", "summary": "Emergency assumptions require nonnegative reviewer availability and positive durations."})
      } else {
        new deficits in {
          if (reviewers >= 2) { deficits!([0, 0]) } else {
            if (reviewers == 1) { deficits!([1, 0]) } else { deficits!([2, 1]) }
          } |
          for(@[twoDeficit, oneDeficit] <- deficits) {
            out!({
              "assumptions": {"availableIndependentReviewers": reviewers, "minutesPerReview": reviewMinutes, "deadlineMinutes": deadlineMinutes, "parallelReviews": true},
              "proposed": {"approvals": 2, "reviewerDeficit": twoDeficit, "distinctReviewerCombinations": reviewers * (reviewers - 1) / 2, "feasible": reviewers >= 2 and reviewMinutes <= deadlineMinutes},
              "alternative": {"approvals": 1, "reviewerDeficit": oneDeficit, "distinctReviewerCombinations": reviewers, "feasible": reviewers >= 1 and reviewMinutes <= deadlineMinutes},
              "summary": "Scenario assumptions: ${reviewers} independent reviewer(s), ${minutes}-minute parallel reviews, ${deadline}-minute deadline. Two approvals: reviewer deficit ${twoDeficit}, ${pairs} distinct reviewer pairs, feasible=${twoFeasible}. One approval: reviewer deficit ${oneDeficit}, ${reviewers} choices, feasible=${oneFeasible}. This arithmetic does not authorize a bypass; define incident ownership and a follow-up audit." %% {"reviewers": reviewers, "minutes": reviewMinutes, "deadline": deadlineMinutes, "twoDeficit": twoDeficit, "oneDeficit": oneDeficit, "pairs": reviewers * (reviewers - 1) / 2, "twoFeasible": reviewers >= 2 and reviewMinutes <= deadlineMinutes, "oneFeasible": reviewers >= 1 and reviewMinutes <= deadlineMinutes}
            })
          }
        }
      }
    }
  }
}
```

### BluePlanner

Source: [BluePlanner.rho](../../../demo/red-blue/agents/BluePlanner.rho)

```rholang
contract main(@input, return) = {
  new gpt4(`rho:ai:gpt4`) in {
    gpt4!("Use the brief and calculator results for scenario facts. You may apply general engineering knowledge, clearly distinguishing it from supplied facts and editable scenario assumptions. No live browsing is available: do not claim current web verification or fabricate citations. Label missing information. Do not invent evidence or claim to execute actions. Propose a practical engineering decision in at most 180 words. Include staffing, an emergency-fix path, rollout, success measures and rollback. Honor constraints and identify unresolved tradeoffs."
      ++ "\nBrief: " ++ input.getOrElse("input", Nil)
      ++ "\nCapacity calculation: " ++ input.get("reviewCapacity").get("summary")
      ++ "\nEmergency calculation: " ++ input.get("emergencyReviewPolicy").get("summary"), *return)
  }
}
```

### RedLogic

Source: [RedLogic.rho](../../../demo/red-blue/agents/RedLogic.rho)

```rholang
contract main(@input, return) = {
  new gpt4(`rho:ai:gpt4`) in {
    gpt4!("Use the brief and calculator results for scenario facts. You may apply general engineering knowledge, clearly distinguishing it from supplied facts and editable scenario assumptions. No live browsing is available: do not claim current web verification or fabricate citations. Label missing information. Do not invent evidence or claim to execute actions. Review the proposal for contradictions and missing assumptions. Give at most two findings labeled L1 and L2. Each must include a concrete failure scenario and a suggested change or verification. If no material issue exists, say so without manufacturing an objection. Maximum 120 words."
      ++ "\nBrief: " ++ input.getOrElse("input", Nil)
      ++ "\nProposal: " ++ input.getOrElse("bluePlanner", Nil), *return)
  }
}
```

### RedEvidence

Source: [RedEvidence.rho](../../../demo/red-blue/agents/RedEvidence.rho)

```rholang
contract main(@input, return) = {
  new gpt4(`rho:ai:gpt4`) in {
    gpt4!("Use the brief and calculator results for scenario facts. You may apply general engineering knowledge, clearly distinguishing it from supplied facts and editable scenario assumptions. No live browsing is available: do not claim current web verification or fabricate citations. Label missing information. Do not invent evidence or claim to execute actions. Review the proposal for unsupported claims and missing evidence. Give at most two findings labeled E1 and E2. Each must include a concrete failure scenario and a suggested change or verification. If no material issue exists, say so. Maximum 120 words."
      ++ "\nBrief: " ++ input.getOrElse("input", Nil)
      ++ "\nProposal: " ++ input.getOrElse("bluePlanner", Nil), *return)
  }
}
```

### RedOperations

Source: [RedOperations.rho](../../../demo/red-blue/agents/RedOperations.rho)

```rholang
contract main(@input, return) = {
  new gpt4(`rho:ai:gpt4`) in {
    gpt4!("Use the brief and calculator results for scenario facts. You may apply general engineering knowledge, clearly distinguishing it from supplied facts and editable scenario assumptions. No live browsing is available: do not claim current web verification or fabricate citations. Label missing information. Do not invent evidence or claim to execute actions. Review staffing, rollout and operational failure handling. Give at most two findings labeled F1 and F2. Each must include a concrete failure scenario and a suggested change or verification. If no material issue exists, say so. Maximum 120 words."
      ++ "\nBrief: " ++ input.getOrElse("input", Nil)
      ++ "\nProposal: " ++ input.getOrElse("bluePlanner", Nil)
      ++ "\nCapacity calculation: " ++ input.get("reviewCapacity").get("summary")
      ++ "\nEmergency calculation: " ++ input.get("emergencyReviewPolicy").get("summary"), *return)
  }
}
```

### BlueResponder

Source: [BlueResponder.rho](../../../demo/red-blue/agents/BlueResponder.rho)

```rholang
contract main(@input, return) = {
  new gpt4(`rho:ai:gpt4`) in {
    gpt4!("Use the brief and calculator results for scenario facts. You may apply general engineering knowledge, clearly distinguishing it from supplied facts and editable scenario assumptions. No live browsing is available: do not claim current web verification or fabricate citations. Label missing information. Do not invent evidence or claim to execute actions. Revise the proposal using all three reviews. Address EVERY finding by its label with CHANGE, MITIGATE, or ACCEPT RISK and a reason. Do not silently drop unresolved concerns. Preserve missing information. Include responsible roles, success measures and rollback. Maximum 300 words."
      ++ "\nBrief: " ++ input.getOrElse("input", Nil)
      ++ "\nOriginal proposal: " ++ input.getOrElse("bluePlanner", Nil)
      ++ "\nLogic review: " ++ input.getOrElse("redLogic", Nil)
      ++ "\nEvidence review: " ++ input.getOrElse("redEvidence", Nil)
      ++ "\nOperations review: " ++ input.getOrElse("redOperations", Nil)
      ++ "\nCapacity calculation: " ++ input.get("reviewCapacity").get("summary")
      ++ "\nEmergency calculation: " ++ input.get("emergencyReviewPolicy").get("summary"), *return)
  }
}
```

### DecisionWriter

Source: [DecisionWriter.rho](../../../demo/red-blue/agents/DecisionWriter.rho)

```rholang
contract main(@input, return) = {
  new gpt4(`rho:ai:gpt4`), answerCh in {
    gpt4!("Use the brief and calculator results for scenario facts. You may apply general engineering knowledge, clearly distinguishing it from supplied facts and editable scenario assumptions. No live browsing is available: do not claim current web verification or fabricate citations. Label missing information. Do not invent evidence or claim to execute actions. Write a decision brief with exactly these four headings: Recommendation; Changes after review; Remaining risks; Rollout checklist. Preserve all finding labels and their dispositions, unresolved concerns, missing evidence, responsible roles, success measures and rollback. Do not turn accepted risk into a resolved issue or say there are no unresolved concerns when risks remain. State the calculator assumptions and do not recommend a fallback that the emergency feasibility calculation rules out. Treat any new numerical rollout threshold as a proposal requiring agreement, not a measured fact. Maximum 240 words and 1900 characters total."
      ++ "\nBrief: " ++ input.getOrElse("input", Nil)
      ++ "\nReviewed plan: " ++ input.getOrElse("blueResponder", Nil)
      ++ "\nCapacity calculation: " ++ input.get("reviewCapacity").get("summary")
      ++ "\nEmergency calculation: " ++ input.get("emergencyReviewPolicy").get("summary"), *answerCh) |
    for (@answer <- answerCh) {
      return!(answer ++ " Calculator evidence (editable scenario assumptions): "
        ++ input.get("reviewCapacity").get("summary")
        ++ " " ++ input.get("emergencyReviewPolicy").get("summary"))
    }
  }
}
```
