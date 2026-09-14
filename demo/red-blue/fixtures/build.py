"""Deterministic model-boundary substitutes; all Rholang logic stays authoritative."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('render_red_blue', ROOT / 'render.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

CASES = [
    {'name': 'acceptable', 'brief': 'Accept a deployment plan with a budget of 100 USD per month.', 'rounds': 1, 'stop': 'converged: no blockers'},
    {'name': 'revision', 'brief': 'Revise a deployment plan to stay within 100 USD per month.', 'rounds': 2, 'stop': 'converged: no blockers'},
    {'name': 'limit', 'brief': 'Limit a deployment plan to 100 USD per month, with an unresolved operational blocker.', 'rounds': 3, 'stop': 'review limit reached; human review required'},
    {'name': 'malformed', 'brief': 'Malformed test: review a deployment plan with a budget of 100 USD per month.', 'rounds': 1, 'stop': 'incomplete review; human review required'},
    {'name': 'accepted-risk', 'brief': 'Risk review of a deployment plan with a budget of 100 USD per month.', 'rounds': 2, 'stop': 'converged: no blockers'},
]


def plan(amount):
    return f'RB1;P|Deploy four workers with an owner and rollback checkpoint;C|C1|max|USD/month|100|provided|100 USD per month;T|C1|USD/month|4|{amount}|estimate|estimated monthly cost per worker;END;'


def mock_source(source, body):
    if 'model(`rho:ai:gpt4`)' not in source:
        return source
    return source.replace('model(`rho:ai:gpt4`)', 'model').replace(' in {\n', ' in {\n contract model(@prompt, out) = { ' + body + ' } |\n', 1)


def fixtures():
    codes = module.sources()
    codes['BluePlanner'] = mock_source(codes['BluePlanner'], 'if (invocation.get("input").slice(0, 5) == "Revis" or invocation.get("input").slice(0, 5) == "Limit") { out!(' + json.dumps(plan(30)) + ') } else { out!(' + json.dumps(plan(20)) + ') }')
    codes['BlueResponder'] = mock_source(codes['BlueResponder'], '''
      if (invocation.get("input").get("brief").slice(0, 4) == "Risk") {
        out!("RB1;P|Deploy four workers with an owner and rollback checkpoint;T|C1|USD/month|4|20|estimate|estimated cost;A|O1|ACCEPT_RISK|Small monitoring gap is acceptable for pilot|SRE lead|Review after seven days;END;")
      } else {
        if (invocation.get("input").get("brief").slice(0, 5) == "Limit") {
          out!("RB1;P|Keep four expensive workers pending human review;T|C1|USD/month|4|30|estimate|estimated cost;A|L1|CHANGE|Retain current workers pending investigation|?|?;END;")
        } else {
          out!("RB1;P|Switch four workers to the cheaper tier with rollback;T|C1|USD/month|4|20|estimate|estimated cost;A|L1|CHANGE|Use the cheaper worker tier within the budget|?|?;END;")
        }
      }
    ''')
    codes['RedLogic'] = mock_source(codes['RedLogic'], '''
      if (invocation.get("input").get("brief").slice(0, 5) == "Revis" or invocation.get("input").get("brief").slice(0, 5) == "Limit") {
        if (invocation.get("input").get("round") == 1 or invocation.get("input").get("brief").slice(0, 5) == "Limit") {
          out!("RB1;F|L1|blocking|open|The worker tier exceeds the monthly budget;END;")
        } else { out!("RB1;F|L1|blocking|resolved|The revised worker tier fits the original budget;END;") }
      } else { out!("RB1;END;") }
    ''')
    codes['RedEvidence'] = mock_source(codes['RedEvidence'], 'if (invocation.get("input").get("brief").slice(0, 9) == "Malformed") { out!("This is not RB1") } else { out!("RB1;END;") }')
    codes['RedOperations'] = mock_source(codes['RedOperations'], 'if (invocation.get("input").get("brief").slice(0, 4) == "Risk") { out!("RB1;F|O1|nonblocking|open|Pilot monitoring has a small gap;END;") } else { out!("RB1;END;") }')
    codes['DecisionWriter'] = mock_source(codes['DecisionWriter'], 'out!("Recommendation: inspect the local verification result. Changes after review: see the retained round history. Remaining risks: retain unresolved findings. Rollout checklist: owner, checkpoint and rollback.")')
    return {'agents': codes, 'cases': CASES}


if __name__ == '__main__':
    (ROOT / 'fixtures/deterministic.json').write_text(json.dumps(fixtures(), indent=2) + '\n')
