# Defect ledger

Every defect found during the testing campaign, in the order it was found, with
the evidence for each. This is a laboratory notebook rather than a changelog:
it records what was believed, what was measured, and what the measurement
changed — including the occasions where the belief was mine and it was wrong.

Each entry follows the same shape: the **symptom** a user would report, the
**measurement** that identified the cause, the **fix**, and the **guard** that
now prevents its return. Every guard was verified by reintroducing the defect
and confirming the test fails, then restoring the fix. A regression test that
has never failed proves nothing.

---

## Summary

| #   | Defect                                                     | Severity | Found by                                |
| --- | ---------------------------------------------------------- | -------- | --------------------------------------- |
| 1   | Team-delete confirmation trapped under the loading overlay | high     | reading the flow against its fixed twin |
| 2   | Home redirect inverted                                     | medium   | reading the route table                 |
| 3   | Finalized-but-failed deploys reported as success           | high     | writing an edge-case test               |
| 4   | German and French rendered a blank interface               | high     | an i18n completeness check              |
| 5   | The dock stopped reporting once full                       | medium   | a provider test                         |
| 6   | A signed-out wallet kept its event stream open             | high     | a provider test                         |
| 7   | The delete icon on a team card was zero pixels wide        | high     | the first browser run                   |
| 8   | Cancel was drawn in its own background colour              | high     | **looking at a screenshot**             |
| 9   | Saving a new team crashed before the request was sent      | high     | the first team-assembly browser journey |
| 10  | The only way out of an editor was unreachable by keyboard  | medium   | writing a browser journey               |
| 11  | Two suites were silently running in the wrong environment  | high     | `eslint --fix` moved a docblock         |
| 12  | Saving before the editor loaded wrote an empty agent       | high     | **a flaky browser test**                |

Three of these — 1, 7, and 8 — present to a user as the identical sentence
_"I cannot delete this."_ They have no cause in common. That is the ledger's
central lesson: one symptom, three unrelated defects, and the two found last
were invisible to every test that does not open a browser.

Defect 9 is the same lesson from the other direction: it sits on the most
ordinary path a new team takes, and 570 passing tests never touched it, because
no test had ever assembled a team the way a person does.

Defect 12 arrived as a **flaky test** — the kind of result it is tempting to
re-run until it is green. It was not flaky; it was a race the test happened to
lose two times in ten, and losing it destroys an agent's code.

---

## 1. The team-delete confirmation could not be answered

**Symptom.** Clicking delete on an agent team showed a confirmation dialog that
could not be confirmed. The page appeared frozen until reloaded.

**Measurement.** `AgentTeamsTab` wrapped its whole delete flow in
`useCallbackWithLoader`, which shows the global spinner before the body runs and
hides it only in `finally`. The body then awaited the confirmation. The spinner
renders at `z-index: 100000`; the dialog at `1000`. The spinner was therefore
covering the dialog it was waiting on: the button could not be clicked, so the
promise could not settle, so `hide()` was never reached.

This is the same defect as the agent-tab bug fixed earlier in `ceebcb8`. That
commit corrected one call site. Nothing prevented the pattern anywhere else,
and the teams tab kept the original shape.

**Fix.** The structure the agent tab already used: the publication read under
its own loader wrap, the dialogs awaited while the loader is idle, the mutation
under a wrap of its own. The loader is refcounted, so the nesting is safe.

**Guards.** `deleteTeamFlowOrder.test.tsx` asserts the dialog observes an idle
loader. `dialogUnderLoaderAudit.test.ts` parses the TypeScript syntax tree of
every source file, finds the local names bound to `useAlert`/`useConfirm`/
`useFormModal`, and fails if any is awaited inside a `useCallbackWithLoader`
argument — so the _class_ cannot recur, not merely this instance. Binding-based
detection matters: `confirm` is also a browser global, and a text search would
flag `window.confirm` while missing a dialog bound to a different name.

**Verified.** Reintroducing the wrapper failed three of five order tests and
made the audit report both offending lines by file and line number.

---

## 2. Signed-in users were sent to the login screen

**Symptom.** A signed-in user visiting `/` landed on the login page.

**Measurement.** `Home.tsx` routed `state.ready` to `/login` and everyone else
to `/dashboard` — inverted. It survived because the signed-out case still
_worked_: `/dashboard` bounced through `ProtectedRoute` back to `/login`. A
guard meant for direct navigation was covering for the wrong redirect.

**Fix.** Swap the branches.

**Guard.** `routeRedirects.test.tsx`, the repository's first MemoryRouter test.
Getting there required supplying `TextEncoder`, which React Router 7 reads at
import time and jsdom does not implement — **the reason no test in this
repository had ever used a real router**, leaving route-level behaviour wholly
uncovered.

**A subtlety the browser tier later revealed.** This redirect cannot be
observed by navigating to `/` in a browser after signing in, because the wallet
is held in memory only: the navigation signs the user out first. That is worth
knowing on its own — refreshing ends the session, and a bookmarked deep link
never opens signed in — and it is pinned in `e2e/tests/auth/signIn.spec.ts`.

---

## 3. A deploy that failed on chain was reported as success

**Symptom.** An operation that recorded nothing was reported as saved,
deployed, or transferred.

**Measurement.** `EmbersEvents.handleMessage` resolved the pending wait for any
observer `Finalized` frame without reading the `errored` flag arriving on the
same frame. `errored: true` means the deploy finalized and its execution
_failed_ — insufficient funds, a contract that threw. Every caller treats a
resolved wait as success.

**Fix.** Reject, with wording that is deliberately the opposite advice from the
timeout rejection: a timeout means the deploy may still land, so verify before
retrying; an errored finalization is settled and recorded nothing, so retrying
is correct. Conflating them produces either a duplicate record or an abandoned
operation.

**Guard.** `EmbersEventsEdges.test.ts` asserts the rejection, its retry advice,
and — the guard against over-correcting — that a clean finalization still
resolves.

**How it was found.** As a `PINNED, NOT ENDORSED` test recording current
behaviour. Reading back what the pin said — _a caller who awaits finalization
and then reports "saved" will report success for a deploy that did nothing_ —
made clear it was a defect, not a quirk. The test was inverted and the code
fixed.

---

## 4. German and French rendered a blank interface

**Symptom.** Choosing German or French left most controls with no label.

**Measurement.** `sync-i18n` fills untranslated keys with an empty string, and
**148 of 168 keys** in each catalogue were empty. i18next returns `""` as a
valid translation by default, so it never falls back. Measured directly:

```
t("dashboard.logout")   in de -> "Abmelden"      (one of the 20 translated)
t("deploy.deploy")      in de -> ""              (one of the 148 empty)
t("deploy.moreActions") in de -> "More actions"  (key ABSENT, so it falls back)
```

The unevenness is what hid it: an _absent_ key falls back correctly, so the
five newest keys rendered in English while everything around them was blank.

**Fix.** `returnEmptyString: false`. An empty translation is now treated as
missing and falls back to English — exactly how an absent key already behaved.
English text in a German interface is a visible gap someone can report; a blank
button looks like a rendering fault and gives the user nothing to describe.

**Guard.** `i18nCompleteness.test.ts` drives i18next rather than diffing JSON,
because the contract that matters is user-visible: every key the app can ask
for resolves to readable text in every language offered. Failures are listed by
key name.

---

## 5. The dock stopped reporting once it was full

**Symptom.** In a long editing session the Logs and Deploy History panels
stopped showing new entries.

**Measurement.** Entries are prepended, so the newest is at index 0. `clamp`
kept the **tail**:

```js
arr.length > max ? arr.slice(arr.length - max) : arr; // keeps the OLDEST
```

Once the cap was reached every new entry was discarded on arrival. With a cap
of 3 and entries a, b, c, d, e the visible list was `c, b, a` rather than
`e, d, c`.

**Fix.** `arr.slice(0, max)`.

**Why it matters more than a display quirk.** The dock is the _only_ place a
deploy failure or a run link is reported inside the editors; there is no toast
system. A full dock silently ceased reporting exactly when there was most to
report, and a panel full of old entries looks like a working panel.

**Guard.** `dockProvider.test.tsx` asserts both the resulting list and the
consequence in a user's terms: after filling the dock, the top entry is the one
that just happened.

---

## 6. A signed-out wallet kept listening

**Symptom.** None visible. A resource and privacy defect.

**Measurement.** Constructing an SDK opens a finalization WebSocket that
reconnects on every close, so an abandoned SDK does not go quiet. Counting
sockets across a session:

```
setKey(A)  -> 1 socket
setKey()   -> still 1, STILL OPEN
setKey(B)  -> 2 sockets, BOTH OPEN
```

Every sign-in leaked one socket plus its reconnect loop, and the signed-out
wallet's deploy events kept flowing to a client that no longer represented that
user.

**Fix.** `WalletProvider` closes the _replaced_ SDK's stream. Deliberately not
an unmount cleanup: the app runs under `StrictMode`, which mounts effects twice
in development, and an unmount cleanup would close the socket of an SDK the
simulated remount does not recreate — leaving every developer with a dead
wallet. Closing on replacement fires on a genuine value change instead.

This fix was only possible because the campaign had already added
`EmbersEvents.close()`; before that the class exposed no way to stop its socket
or its reconnect timer at all. That is the same defect that forces the
repository's seed script to call `process.exit(0)` — one root cause seen from
two ends.

**Guard.** `walletProvider.test.tsx` asserts that after signing in, out, and in
again, exactly one of the three sockets constructed is still open.

---

## 7. Teams could not be deleted: a zero-width icon

**Symptom.** _"I cannot delete this team."_ The trash icon was not there.

**Measurement.** In a real browser:

```
agent card: {"x":716,   "y":440.5, "width":24, "height":24}   clickable
team card:  {"x":793.5, "y":440.5, "width":0,  "height":24}   unclickable
```

Computed style on the team card's icon: `display: block`,
`visibility: visible`, `opacity: 1`. It passed every ordinary "is it rendered"
check.

`.delete-icon` is a flex item sharing its row with the button group. An `<svg>`
with width and height attributes but no `flex-shrink` rule is compressible, and
flex items default to `flex-shrink: 1`. An agent card's buttons are Edit +
Details; a **team** card's are Edit + Details + Publish. That one extra button
consumed the remaining space and the icon absorbed the shortfall.

**Fix.** `flex-shrink: 0`.

**Guard.** The e2e suite asserts the measured width is non-zero on both card
types **and that the two are equal**, so any future card variant that adds a
button fails here rather than silently squeezing the control again.

**Why no unit test could have found it.** jsdom implements no layout engine.
Every bounding box it reports is zero, so a collapsed element and a healthy one
are identical there.

---

## 8. Cancel was invisible on every confirmation

**Symptom.** Confirmation dialogs showed "Confirm" beside an empty grey
rectangle. No visible way to decline.

**Measurement.** On a `.secondary` button:

```
background-color: rgb(241, 243, 245)
color:            rgb(241, 243, 245)
contrast ratio:   1.0
```

`.secondary` set `color: var(--text-white)`. `--text-white` (`#f1f3f5`) is
defined **only** in the `:root` block, which is the dark theme. `.light-theme`
never redefines it, so it kept that value — while `.light-theme` sets
`--background-neutral-hover` to `#f1f3f5`, the same colour. The label was
painted in exactly its own background.

**Fix.** Use `--text-color-primary`, which _is_ redefined per theme
(`#f1f3f5` dark, `#0b0f14` light) and therefore contrasts in both.

**The deeper hazard.** `--text-white` names an _appearance_ rather than a
_role_. A token called "white" reads as safe to use anywhere, but it exists in
only one theme, so any light-theme use is a latent collision. Role-named tokens
cannot fail this way.

**Guard.** Two checks computing the WCAG relative-luminance contrast ratio from
computed styles: a sweep over every labelled button that paints its own
background, and a targeted check on the Cancel button of an open delete
confirmation.

**Both were needed.** Reintroducing the defect fails only the targeted check —
on the dashboard with no dialog open, the visible secondary buttons are
icon-only and are filtered out for having no label. A broad invariant covers
breadth, not the specific case a user reported.

**How it was found.** By looking at a screenshot captured for the usage
documentation. The media pipeline was built to document the product and
immediately found a defect in it.

---

## 9. Saving a new team crashed before the request was sent

**Symptom.** Create a team, drag one node onto the canvas, press **Save as
Draft**. Nothing is saved. There is no dialog and no visible failure — only a
line in the dock reading `Save failed: Cannot read properties of undefined
(reading 'filter')`.

**Measurement.** The browser journey that assembles a team recorded the network
traffic: after the click, **no request was issued at all**. Not a rejected
save — a save that never left the page.

The graph editor's header built its payload with non-null assertions:

```ts
edges: agentsTeam.edges!,
nodes: agentsTeam.nodes!,
```

Both are genuinely optional on the current-team state. `nodes` is assigned by
the first drop; `edges` is assigned by the first _connection_. A team with one
node and no edges therefore carries `edges === undefined`, and the projection
starts with

```ts
const connectedEdges = edges.filter(/* ... */);
```

Every other consumer already defaulted — the editor passes `agentsTeam.edges ??
[]` into the canvas, and the deploy handler passes `?? []` into the validator.
The save payload was the one place that did not, and the assertion made the
type system agree with it.

**Fix.** Default both once, at the top of `saveOrCreate`, and use those locals
for the payload and for the definition the editor records afterwards.

**Guard.** `apps/embers/tests/graphHeaderSave.test.tsx`, which drives the real
projection rather than mocking it — replacing `@/lib/workflow` would have left
the test asserting that a button calls a function, which was never in doubt.
Four of its seven cases fail against the pre-fix code, and the failure message
is the TypeError verbatim.

**Why nothing caught it.** The state is unreachable from any fixture: a
hand-written team has an `edges` array because a person writing a fixture
supplies one. Only assembling a team the way the interface does — drop, then
save, without connecting anything — produces it.

---

## 10. The only way out of an editor was unreachable by keyboard

**Symptom.** Inside the agent or team editor, a keyboard user cannot leave. The
back control and the settings control are not in the tab order, and a screen
reader announces neither.

**Measurement.** Both were click-handling `div`s:

```tsx
<div className={classNames("fa", "fa-arrow-left", styles.cursor)}
     onClick={onBackClick} />
<SettingsIcon className={styles["settings-icon"]} onClick={onSettingsClick} />
```

A `div` has no role, no accessible name, and no place in the tab sequence. The
icon carries no text, so there is nothing to announce even if it were focusable.
The repository already holds this standard elsewhere — the editor's split-button
caret is icon-only and carries an `aria-label`, with a test asserting it.

**Fix.** Real `<button type="button">` elements with `aria-label`s drawn from
the existing catalogue (`publish.backToDashboard`, `agents.generalSettings`),
and a `.icon-button` class that strips the user-agent chrome so the rendering is
unchanged. The arrow glyph is marked `aria-hidden`: the button's label carries
the meaning, and an exposed icon-font character announces as noise beside it.

**Guard.** `apps/embers/tests/editorChromeHeader.test.tsx` — five cases
covering names, activation, tab order, keyboard activation, and the hidden
glyph. All five fail against the pre-fix markup.

**How it was found.** Writing a browser journey that needed to return to the
dashboard without reloading the page. There was no control to address by role,
which is the same fact a keyboard user meets.

---

## 11. Two suites were silently running in the wrong environment

**Symptom.** 23 tests failed at once with `Cannot read properties of undefined
(reading 'clear')` on `localStorage.clear()` — in suites that had been passing
minutes earlier and whose source had not been edited by hand.

**Measurement.** `eslint --fix` had sorted imports, and in doing so moved an
import _above_ the file's opening docblock:

```tsx
import type { PropsWithChildren } from "react";

/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
```

Jest reads the environment pragma only from the **first** docblock in a file.
Displaced, it is ignored, and the suite runs under `node` — no `document`, no
`localStorage`. The failure surfaces at the first DOM access, which points at
the assertion rather than at the cause, and nothing reports that the pragma was
disregarded.

The autofix did this because the docblock was the leading comment of the first
import statement, so the sorter carried it along as that import's comment.

**Fix.** The pragma restored to the top of each affected file, separated from
the imports by a blank line so it is a comment on the program rather than on any
one import.

**Guard.** `apps/embers/tests/jestEnvironmentPragma.test.ts`, which reads every
test file and asserts that any file declaring an environment begins with that
declaration and declares it exactly once — the second check because a duplicate
pragma is worse than a displaced one: Jest honours the first and ignores the
second, so the file reads as though it runs under an environment it does not.
Verified by reproducing the displacement, which fails the first check and only
that one.

**Worth stating plainly.** This defect was introduced by a tool run in the
course of fixing something else, and it would have been committed had the full
suite not been re-run afterwards. It is the argument for the canonical gate
being a whole-suite run rather than a targeted one.

---

## 12. Saving before the editor loaded wrote an empty agent

**Symptom.** Open an agent and press **Save changes** promptly, before the code
appears. The save succeeds. The agent's newest version now has empty code — and
that is the version a team compiles.

**Measurement.** A browser journey failed roughly two runs in ten on
`expect(backend.store.agents[0].code).not.toBe("")`, and passed when run alone.
The tempting reading is a flaky test. It was not: the test was losing a real
race, and the race has a loser in production too.

`getCode()` is `editorRef.current?.getText()`. The editor assigns its ref only
once it has loaded its tree-sitter grammar and opened the document, so before
that it returns `undefined`. The header did:

```ts
const code = getCode() ?? "";
```

which turns "the editor has nothing to give" into "the document is empty".
Those are different facts and only one of them is a legitimate thing to save.
The header renders immediately, so the window is open for as long as the
grammar takes to load.

The two cases differ in severity:

| Situation             | What the empty save did                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| A new agent           | Discarded the seeded skeleton and created an agent with no code                  |
| **An existing agent** | **Appended a version whose code is empty**, replacing what the agent compiles to |

The second is data loss from a plausible, reflexive action. Earlier versions
survive on chain, so it is recoverable — by someone who knows to look.

**Fix.** Refuse. `getCode()` returning `undefined` or `null` now throws a
message saying the editor is still loading and to try again, which the dock
shows. The author's work is still on screen and a retry a moment later
succeeds, so refusing costs nothing and saves the version.

**Guard.** Five cases in `apps/embers/tests/codeHeaderSave.test.tsx`: no
creation, no save, the reason reaching the dock, no navigation to deploy, and —
the guard against over-correcting — that a document the author has _genuinely_
emptied still saves. Four fail against the pre-fix code; the fifth passes both
ways, which is correct, because it exercises a ready editor.

The browser journey now waits for the skeleton text rather than for the save
button, since the button appears first.

**Worth noticing.** The file already carried this comment above `getCode`:

> Read the active document rather than one keyed by name, so a rename can never
> desync the two and **silently save empty code**.

Someone had already met this class of bug and closed one door. This was the
other one.

---

## Corrections to my own assumptions

Recorded because a campaign that only lists the code's mistakes is not an
honest record.

| Belief                                                      | What measurement showed                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The pinned OpenAPI schema was stale relative to the backend | Recursively identical to a freshly regenerated one. Acting on the claim would have meant a needless client regeneration.                                                                                                                                                                                                                                              |
| Every canvas produces a definition that validates           | False, and rightly so: the editor is permissive, the validator strict. fast-check refuted it on the first case.                                                                                                                                                                                                                                                       |
| No `%N` placeholder survives substitution                   | False when a field's _value_ is `%1`. Replaced with a stronger law: a marker-shaped value is inserted literally, exactly once.                                                                                                                                                                                                                                        |
| Dropping an agent creates a node immediately                | It opens a configuration dialog first. Worth pinning, because "nothing appeared" also describes a _refused_ drop.                                                                                                                                                                                                                                                     |
| The dock lists oldest first                                 | Newest first — and correcting that assumption is what exposed defect 5.                                                                                                                                                                                                                                                                                               |
| MSW was needed for app-level network control                | The tests construct the SDK themselves, so injection works and is better scoped. The dependency was removed rather than left unused.                                                                                                                                                                                                                                  |
| The lint gate was green                                     | It was measured at the repository root, where `eslint '*'` covers only top-level files. CI lints from inside `apps/embers`, where 53 errors were waiting — including three that predate this campaign.                                                                                                                                                                |
| The stylesheet gate was green                               | Never run. `stylelint` rejected six vendor `:global()` selectors (`.szh-menu__item`, `.react-flow__edge-path`) against a kebab-case-only pattern. The pattern now admits BEM segments, which is what those libraries actually use.                                                                                                                                    |
| The local stack was down, so the live tiers were blocked    | It was running the whole time. The service binds `[::1]:8080` only; I probed `127.0.0.1:8080`, read connection-refused as "not running", and reported it twice — after having already documented the identical IPv4/IPv6 trap for `vite preview` in the Playwright config.                                                                                            |
| Three empty-schema responses were a contract gap            | By design. All three return a polymorphic run outcome, and poem's `Any` emits an empty schema because no accurate concrete type for "any JSON value" exists — so `unknown` is the honest SDK type rather than a symptom. Reported upstream, traced to the handlers by the backend agent, and withdrawn. The assertions remain as pins on which responses are dynamic. |
| My publish-form test asserted the handle default            | It asserted against the wrong element: the form opens with a read-only field, so positional indices were off by one. It passed anyway, by coincidence of substring.                                                                                                                                                                                                   |
