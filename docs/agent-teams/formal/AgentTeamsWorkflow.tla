------------------------ MODULE AgentTeamsWorkflow ------------------------
EXTENDS Integers, FiniteSets, Sequences, TLC

(***************************************************************************)
(* A finite safety abstraction of one Workflow v2 token.                   *)
(*                                                                         *)
(* The model intentionally abstracts portable values, guards, joins, and   *)
(* external activity observations. It focuses on the properties implemented *)
(* by the current control kernel: per-edge bounds, finite hot segments, and *)
(* causal run events.                                                       *)
(***************************************************************************)

CONSTANTS NInput, NLoop, NWait,
          EInputLoop, ELoop, ELoopWait,
          MaxIterations

Nodes == {NInput, NLoop, NWait}
Edges == {EInputLoop, ELoop, ELoopWait}
WaitNodes == {NWait}
FinalNodes == {}
BoundedEdges == {ELoop}

Src(e) ==
  CASE e = EInputLoop -> NInput
    [] e = ELoop      -> NLoop
    [] e = ELoopWait  -> NLoop

Dst(e) ==
  CASE e = EInputLoop -> NLoop
    [] e = ELoop      -> NLoop
    [] e = ELoopWait  -> NWait

EventTypes == {"runStarted", "runSuspended", "runReturned",
               "iterationLimit"}
Phases == {"running", "suspended", "returned"}

VARIABLES node, counters, hotSteps, phase, events

vars == <<node, counters, hotSteps, phase, events>>

TypeOK ==
  /\ node \in Nodes
  /\ counters \in [Edges -> 0..MaxIterations]
  /\ hotSteps \in Nat
  /\ phase \in Phases
  /\ events \in Seq(EventTypes)

Init ==
  /\ node = NInput
  /\ counters = [e \in Edges |-> 0]
  /\ hotSteps = 0
  /\ phase = "running"
  /\ events = <<"runStarted">>

BoundEnabled(e) ==
  \/ e \notin BoundedEdges
  \/ counters[e] < MaxIterations

Step(e) ==
  /\ phase = "running"
  /\ e \in Edges
  /\ Src(e) = node
  /\ BoundEnabled(e)
  /\ node' = Dst(e)
  /\ counters' = IF e \in BoundedEdges
                  THEN [counters EXCEPT ![e] = @ + 1]
                  ELSE counters
  /\ hotSteps' = IF e \in BoundedEdges \/ Dst(e) \in WaitNodes
                  THEN 0
                  ELSE hotSteps + 1
  /\ phase' = IF Dst(e) \in WaitNodes
               THEN "suspended"
               ELSE IF Dst(e) \in FinalNodes THEN "returned"
               ELSE "running"
  /\ events' = IF Dst(e) \in WaitNodes
                THEN Append(events, "runSuspended")
                ELSE IF Dst(e) \in FinalNodes
                     THEN Append(events, "runReturned")
                     ELSE events

Exhaust(e) ==
  /\ phase = "running"
  /\ e \in BoundedEdges
  /\ Src(e) = node
  /\ counters[e] = MaxIterations
  /\ UNCHANGED <<node, counters, hotSteps>>
  /\ phase' = "returned"
  /\ events' = Append(Append(events, "iterationLimit"), "runReturned")

Next ==
  \/ \E e \in Edges : Step(e)
  \/ \E e \in Edges : Exhaust(e)

Spec == Init /\ [][Next]_vars

CounterSafety == \A e \in BoundedEdges : counters[e] <= MaxIterations

(***************************************************************************)
(* For a definition accepted by the residual-graph proof, a hot segment can *)
(* visit no more than Cardinality(Nodes) nodes without crossing a boundary. *)
(***************************************************************************)
HotSegmentSafety == hotSteps <= Cardinality(Nodes)

RunStartsFirst == Len(events) >= 1 /\ Head(events) = "runStarted"

ReturnHasPredecessor ==
  \A i \in 1..Len(events) : events[i] = "runReturned" => i > 1

Safety == TypeOK /\ CounterSafety /\ HotSegmentSafety /\
          RunStartsFirst /\ ReturnHasPredecessor

=============================================================================
