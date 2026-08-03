--------------------------- MODULE StatechartScopes ---------------------------
(*
Finite abstraction of the statechart scope lifecycle implemented by the
durable kernel (packages/embers/src/domain/agents_teams/runtime.rs in the
Embers backend): scope entry with sequential entry activities, initial
seeding with the implicit history override, position recording with the
consumption asymmetry, completion by token-count exhaustion, history capture
at the completion instant, sequential exit activities, and re-entry.

One TLC run covers all three history modes: the scope's declared mode is
chosen nondeterministically at Init.

Traceability to the implementation:
  EnterScope        -> enter_scope             runtime.rs:965-995
  RunEntryActivity  -> advance_scope_lifecycle runtime.rs:601-633 (entry stage)
  StartTokens       -> start_scope_initials    runtime.rs:635-667
                       (remembered history overrides initials, NO mode filter)
  MoveToken         -> record_active_node      runtime.rs:1028-1052
  FanOut            -> adjust_scope_fanout     runtime.rs:1386-1395
  ConsumeToken      -> consume_scope_token     runtime.rs:1054-1086
                       (last positions persist through consumption; history
                        snapshot happens exactly when the count reaches zero)
  RunExitActivity   -> advance_scope_lifecycle runtime.rs:601-633 (exit stage)
  FinishScope       -> finish_scope_instance   runtime.rs:669-686

Deliberate abstractions: portable values, dispositions (every activity
completes), effects are atomic (crash/recovery is DurableHierarchy's model),
joins and correlation epochs, guards, cancellation, nested scopes (depth one,
so lazy deep composition is not exercised), and the history-NODE restore path
(only the implicit re-entry restore is modeled; the multi-target history-node
token-accounting hazard is a code-level finding, not a model target).
*)
EXTENDS Naturals, FiniteSets

CONSTANT MaxEntries

Nodes == {"A", "B"}
Tokens == {"t1", "t2"}
Modes == {"none", "shallow", "deep"}
NoHistory == [hmode |-> "unset", nodes |-> {}]

VARIABLES
    mode,       \* declared history mode of the scope
    phase,      \* "idle" | "entry" | "running" | "exit"
    entryIdx,   \* entry activities completed (0..1)
    exitIdx,    \* exit activities completed (0..1)
    alpha,      \* the kernel's stored live-token counter (active_tokens)
    live,       \* ground truth: the set of live tokens
    lastPos,    \* last recorded position per token ("unrecorded" outside runs)
    hist,       \* captured history for the scope, or NoHistory
    entries,    \* completed entries of the scope so far
    seeded,     \* how the current run was seeded: "none" | "initials" | "history"
    justSeeded  \* true only in the state immediately after StartTokens

vars == <<mode, phase, entryIdx, exitIdx, alpha, live, lastPos, hist,
          entries, seeded, justSeeded>>

Positions(ts) == {lastPos[t] : t \in ts}

Init ==
    /\ mode \in Modes
    /\ phase = "idle"
    /\ entryIdx = 0
    /\ exitIdx = 0
    /\ alpha = 0
    /\ live = {}
    /\ lastPos = [t \in Tokens |-> "unrecorded"]
    /\ hist = NoHistory
    /\ entries = 0
    /\ seeded = "none"
    /\ justSeeded = FALSE

EnterScope ==
    /\ phase = "idle"
    /\ entries < MaxEntries
    /\ phase' = "entry"
    /\ entryIdx' = 0
    /\ justSeeded' = FALSE
    /\ UNCHANGED <<mode, exitIdx, alpha, live, lastPos, hist, entries, seeded>>

RunEntryActivity ==
    /\ phase = "entry"
    /\ entryIdx = 0
    /\ entryIdx' = 1
    /\ justSeeded' = FALSE
    /\ UNCHANGED <<mode, phase, exitIdx, alpha, live, lastPos, hist, entries,
                   seeded>>

(* Remembered nonempty history replaces the declared initials with no mode
   filter -- the implicit default-history rule of runtime.rs:645-650. *)
StartTokens ==
    /\ phase = "entry"
    /\ entryIdx = 1
    /\ LET restore == hist # NoHistory /\ hist.nodes # {}
           targets == IF restore THEN hist.nodes ELSE Nodes
       IN /\ live' = IF Cardinality(targets) = 2 THEN {"t1", "t2"} ELSE {"t1"}
          /\ lastPos' = IF Cardinality(targets) = 2
                        THEN [t \in Tokens |->
                                 IF t = "t1" THEN "A" ELSE "B"]
                        ELSE [lastPos EXCEPT !["t1"] =
                                 CHOOSE n \in targets : TRUE]
          /\ alpha' = Cardinality(targets)
          /\ seeded' = IF restore THEN "history" ELSE "initials"
    /\ phase' = "running"
    /\ justSeeded' = TRUE
    /\ UNCHANGED <<mode, entryIdx, exitIdx, hist, entries>>

MoveToken(t) ==
    /\ phase = "running"
    /\ t \in live
    /\ lastPos' = [lastPos EXCEPT ![t] = IF lastPos[t] = "A" THEN "B" ELSE "A"]
    /\ justSeeded' = FALSE
    /\ UNCHANGED <<mode, phase, entryIdx, exitIdx, alpha, live, hist, entries,
                   seeded>>

FanOut ==
    /\ phase = "running"
    /\ "t1" \in live
    /\ "t2" \notin live
    /\ live' = {"t1", "t2"}
    /\ alpha' = alpha + 1
    /\ lastPos' = [lastPos EXCEPT !["t2"] = lastPos["t1"]]
    /\ justSeeded' = FALSE
    /\ UNCHANGED <<mode, phase, entryIdx, exitIdx, hist, entries, seeded>>

(* Consumption removes the token from the live population but never edits the
   recorded positions; the snapshot at count zero therefore remembers the last
   recorded position of every token that ran, exactly as the kernel does. *)
ConsumeToken(t) ==
    /\ phase = "running"
    /\ t \in live
    /\ live' = live \ {t}
    /\ alpha' = alpha - 1
    /\ IF alpha - 1 = 0
       THEN /\ phase' = "exit"
            /\ exitIdx' = 0
            /\ hist' = IF mode # "none"
                       THEN [hmode |-> mode,
                             nodes |-> Positions(Tokens) \ {"unrecorded"}]
                       ELSE hist
       ELSE /\ phase' = phase
            /\ exitIdx' = exitIdx
            /\ hist' = hist
    /\ justSeeded' = FALSE
    /\ UNCHANGED <<mode, entryIdx, lastPos, entries, seeded>>

RunExitActivity ==
    /\ phase = "exit"
    /\ exitIdx = 0
    /\ exitIdx' = 1
    /\ justSeeded' = FALSE
    /\ UNCHANGED <<mode, phase, entryIdx, alpha, live, lastPos, hist, entries,
                   seeded>>

(* The instance is destroyed: recorded positions die with it, the history
   store (keyed by the definition scope) survives. *)
FinishScope ==
    /\ phase = "exit"
    /\ exitIdx = 1
    /\ phase' = "idle"
    /\ entries' = entries + 1
    /\ lastPos' = [t \in Tokens |-> "unrecorded"]
    /\ justSeeded' = FALSE
    /\ UNCHANGED <<mode, entryIdx, exitIdx, alpha, live, hist, seeded>>

(* The scope has consumed its entry budget; the model terminates by
   stuttering, which keeps TLC's deadlock check meaningful for every
   non-terminal state. *)
Terminating ==
    /\ phase = "idle"
    /\ entries = MaxEntries
    /\ UNCHANGED vars

Next ==
    \/ EnterScope
    \/ RunEntryActivity
    \/ StartTokens
    \/ \E t \in Tokens : MoveToken(t)
    \/ FanOut
    \/ \E t \in Tokens : ConsumeToken(t)
    \/ RunExitActivity
    \/ FinishScope
    \/ Terminating

Spec == Init /\ [][Next]_vars

--------------------------------------------------------------------------------

TypeOK ==
    /\ mode \in Modes
    /\ phase \in {"idle", "entry", "running", "exit"}
    /\ entryIdx \in 0..1
    /\ exitIdx \in 0..1
    /\ alpha \in 0..2
    /\ live \subseteq Tokens
    /\ lastPos \in [Tokens -> Nodes \union {"unrecorded"}]
    /\ hist = NoHistory \/ (hist.hmode \in Modes /\ hist.nodes \subseteq Nodes)
    /\ entries \in 0..MaxEntries
    /\ seeded \in {"none", "initials", "history"}
    /\ justSeeded \in BOOLEAN

(* The kernel's stored counter always equals the live population it stands
   for -- token conservation across seeding, fan-out, and consumption. *)
CounterFaithful == alpha = Cardinality(live)

(* Entry activities strictly precede any token: the scope holds no tokens
   until the entry lifecycle finishes. *)
EntryBeforeTokens == phase \in {"idle", "entry"} => live = {} /\ alpha = 0

(* Exit activities run only on a drained scope. *)
ExitAfterDrain == phase = "exit" => live = {}

(* A running scope is never empty: emptiness is exactly completion. *)
RunningHasTokens == phase = "running" => live # {}

(* History exists only after a completion has captured it. *)
CaptureAtCompletionOnly ==
    hist # NoHistory => (entries >= 1 \/ phase = "exit")

(* A captured snapshot is faithful: it carries the declared mode and a
   nonempty subset of the scope's nodes. *)
CaptureFaithful ==
    hist # NoHistory => (hist.hmode = mode /\ hist.nodes # {}
                         /\ hist.nodes \subseteq Nodes)

(* The none-mode scope never captures history at all. *)
NoneNeverCaptures == mode = "none" => hist = NoHistory

(* Restoration soundness at the seeding instant: a history-seeded run starts
   exactly on the remembered configuration; an initials-seeded run starts
   exactly on the declared initials. *)
RestoreSound ==
    justSeeded =>
        Positions(live) = IF seeded = "history" THEN hist.nodes ELSE Nodes

(* Each entry finishes at most once: entries never exceeds the bound and only
   FinishScope advances it. *)
FinishBounded == entries <= MaxEntries

Safety ==
    /\ TypeOK
    /\ CounterFaithful
    /\ EntryBeforeTokens
    /\ ExitAfterDrain
    /\ RunningHasTokens
    /\ CaptureAtCompletionOnly
    /\ CaptureFaithful
    /\ NoneNeverCaptures
    /\ RestoreSound
    /\ FinishBounded

================================================================================
