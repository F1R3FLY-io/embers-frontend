# API conformance

Does the running Embers server answer in the shapes this repository was
generated against?

The generated client under `packages/client/src/api-client` is built from
`packages/client/schema.json`. That file is therefore not documentation — it is
what the client _believes_, and every type the application handles follows from
it. This package checks that belief, in two halves that run under very
different conditions.

---

## The two halves

### Offline — runs everywhere, including CI

Everything that can be decided from the pinned document alone: the route table,
the component schemas, and the validator that judges a response body against
them.

```sh
pnpm --filter @f1r3fly-io/embers-api-conformance test
```

This is part of `pnpm -r test`, so it guards on every run. It needs no network
and no chain.

It is not merely a warm-up for the live half. Two of the findings already sent
upstream are derived here, and both are asserted _exactly_ so that a fix
upstream shows up as a failing expectation to update — which is the
notification — rather than silently changing a number nobody reads:

- **44 of the 55 operations declare only a success code.** A generated client
  cannot type any failure, which is why every error in the SDK arrives as a
  bare `ResponseError` carrying only a status.
- **Three responses declare `content` whose schema is the empty object.** That
  is worse than declaring none: tooling reports the response as described and
  generates no type for it, which is the direct cause of
  `sendResponse: unknown` in the SDK's run, command, and reveal methods — all
  three of which do return structured state. A further four declare no content
  at all, of which two are legitimate (a readiness probe has no body, and the
  deploys subscription is a WebSocket upgrade). The two kinds are reported
  separately because the fix differs.

### Live — opt-in, never in CI

Real requests against a real local stack.

```sh
EMBERS_INTEGRATION=1 pnpm --filter @f1r3fly-io/embers-api-conformance itest
```

Without the opt-in, or without a stack answering, every scenario **skips** and
the run prints a boxed banner naming what is missing. It does not fail: an
absent environment is not a defect in the product. It does not pass either — a
scenario that reports success while making no request is how a suite comes to
mean nothing.

That decision is made in `globalSetup`, before any test file is loaded, because
Jest fixes skipping at definition time.

---

## Configuration

| Variable                     | Default             | Meaning                                                   |
| ---------------------------- | ------------------- | --------------------------------------------------------- |
| `EMBERS_INTEGRATION`         | unset               | `1` opts into the live half. Nothing runs without it.     |
| `EMBERS_API_URL`             | `http://[::1]:8080` | The service to probe.                                     |
| `EMBERS_ITEST_ADDRESS`       | unset               | A wallet address whose lists the read scenarios validate. |
| `EMBERS_ITEST_ALLOW_REMOTE`  | unset               | `1` permits a non-loopback `EMBERS_API_URL`. See below.   |
| `EMBERS_ITEST_REQUIRE_STACK` | unset               | `1` makes an unavailable stack fail rather than skip.     |
| `EMBERS_ITEST_ARTIFACTS`     | a temp directory    | Where the evidence ledger is written.                     |

**Loopback is enforced.** This campaign signs real payloads, submits real
mutations, and probes error paths. Doing that to a host someone else operates
is not a test, so a non-loopback address is refused by default rather than
quietly accepted from a stray environment variable.

---

## What a run leaves behind

Every HTTP call is recorded whole, one JSON object per line, in
`ledger.jsonl`: the request, the response, the timing, the operation it
resolved to, and a **copy-pasteable curl** that reproduces it.

That last part is the point. A finding is only worth sending upstream if
someone else can reproduce it, and "the API returned something wrong" is not a
reproduction. JSON Lines rather than one document, because a run that crashes
halfway still leaves a readable file — and that is precisely the run whose
evidence matters most.

Credentials are replaced by their digests, so two occurrences can be compared
without either being readable. The **prepare token is deliberately kept**:
reproducing a send needs it, it expires within a day, and its signing secret is
regenerated per process, so recording it costs nothing while omitting it would
make half the findings unreproducible.

---

## Design notes

**Validation happens on the raw wire body**, before the generated client
deserializes it. The client's mappers coerce and default, so a body that is
wrong on the wire can reach a caller looking entirely plausible. Anything that
has passed through the SDK has already been laundered.

**Ajv consumes the pinned document directly** rather than a hand-written
mirror. Writing zod mirrors of 108 component schemas would create a second
source of truth that drifts from the first — and the first is the artifact the
client was actually generated from.

**The custom formats are defined, not ignored.** The document declares
`uint64`, `timestamp-millis`, `blockchain-address`, `blockchain-uri`,
`public-key`, `int64`, `bytes`, and `graphl`. Ajv warns and skips a format it
does not know, which would silently reduce each of those fields to "is a
string" — and being a string is not the interesting property of an amount or a
registry address.

**Drift is measured, not assumed.** A live run fetches the served spec and
compares the _parsed_ documents. Byte comparison reports differences that are
only serialization, which has already produced one false alarm in this project:
a report that the pin was stale, disproved by finding the two documents
recursively equal with only their sha256 differing. When drift is real, the
comparison names the operations and response codes that differ — "the schema
drifted" is not actionable; "this operation gained a 409 the pin does not
declare" is.
