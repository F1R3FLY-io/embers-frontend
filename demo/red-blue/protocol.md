# Red/blue activity protocol

The team accepts a String query. Eight `structured-v1` agents return `{output: value, disposition: "completed"}`. The state contains the original brief and immutable constraints, current proposal and additive terms, round (1–3), checks, findings keyed by reviewer-specific IDs, responses, errors, and history. The final output is a String.

The model channel returns text. Each model wrapper decodes a deliberately small tagged format **inside Rholang**; it never evaluates model text as code. Format: `RB1;record;record;END;`, one line, no markdown, at most 8192 characters, 48 records, eight fields per record, and 3000 characters per field. Fields use `|`, records use `;`. Prose cannot contain these delimiters. Fields cannot be empty: `?` means unknown.

Each record-producing model agent permits at most two model calls per invocation. If decoding, record-schema validation, term-unit validation, or review-ledger completeness rejects the first answer, it requests one corrected record with the validation error and a bounded excerpt of that answer. Validation restarts from the original invocation state, so partial records from a failed attempt cannot enter the corrected output. Both attempts use identical validation; a second failure remains an explicit error. `modelFormatAttempts` in the agent output records whether one or two calls were used. Reviewer validation checks prior IDs, unchanged blocking severity, substantiated resolution, and the status of new findings before accepting the answer. Blue response validation requires an action for each open finding. The join repeats its ledger checks independently. This does not add workflow rounds or relax review-ledger checks. DecisionWriter returns prose and has no record-correction attempt.

| Record | Fields | Allowed producer |
| --- | --- | --- |
| P | proposal | BluePlanner, BlueResponder; exactly one |
| C | id, max/min, unit, limit, provided/unknown, evidence | BluePlanner only; unique stable ID |
| T | constraint ID, unit, quantity, unit amount, provided/estimate/unknown, evidence | BluePlanner, BlueResponder |
| F | ID, blocking/nonblocking, open/resolved, explanation | Red reviewer; L/E/O prefix enforced |
| A | finding ID, CHANGE/MITIGATE/ACCEPT_RISK, reason, owner, follow-up | BlueResponder; unique ID |

Example: `RB1;P|Use four workers;C|C1|max|USD/month|100|provided|budget 100 USD/month;T|C1|USD/month|4|20|estimate|estimated cost per worker;END;`

Numbers are nonnegative decimals up to 1,000,000 with at most three decimal places. Rholang parses them to integer thousandths. A constraint sums its matching quantity × unit amount terms; repeated work may use multiple additive terms, and available capacity is never itself a consumption term. Model wrappers reject mismatched constraint IDs/units early so the single correction can address them. Supplied estimates remain usable numeric inputs marked as estimates; only absent values are unknown. In the local calculator, units must match exactly. Missing/unknown inputs and incompatible units remain unknown, with unavailable actual/headroom fields. Products finer than a thousandth are rejected instead of rounded into a false pass; choose smaller units. No currency or dimension conversion is inferred locally. Estimates are retained as such. There are no hard-coded task quantities, outside calculations, or f1r3node changes.

ReviewCoverage receives a wait-for-all join correlated to the ConstraintCheck fork epoch. It verifies round/proposal identity and preserves an immutable record of each completed review. Reviewer omission and unsubstantiated resolution fail closed. Open blockers prevent convergence even with an ACCEPT_RISK response. Nonblocking risks may remain with documented acceptance, owner and follow-up. A resolved finding must continue appearing in later reviews. The model determines substantive resolution; Rholang validates the accounting and provenance conditions, not the truth of prose.

The Decide gateway routes all non-revision outcomes to DecisionWriter. The revision edge allows two traversals; its iterationLimit exit goes through Limit to DecisionWriter. This preserves a fully reviewed final proposal, at most three review passes, and per-execution history through containers and nested scopes.
