-------------------------- MODULE DurableHierarchy --------------------------
EXTENDS Integers, Naturals, Sequences, FiniteSets, TLC

(***************************************************************************)
(* A finite abstraction of the durable root/child continuation protocol.   *)
(* Private artifacts are durable before their public revision is advanced; *)
(* effects are dispatched only from an outbox; and a command resumes the   *)
(* one child wait named by a path-qualified identity.                       *)
(***************************************************************************)

CONSTANTS MaxRevision, MaxEffects, ChildId, WaitId

Revisions == 0..MaxRevision
NoRevision == -1
RootPhases == {"running", "suspending", "suspended", "completed"}
ChildPhases == {"running", "suspended", "completed"}
CommandPhases == {"none", "claimed", "applied"}
EventTypes == {"runStarted", "runSuspended", "runResumed", "runCompleted"}
QualifiedWait == <<ChildId, WaitId>>

VARIABLES artifacts, ledgerRevision, ledgerHistory, stagedRevision,
          rootPhase, childPhase, waitPath,
          outbox, dispatched, pendingObservation,
          observedEffects, appliedEffects,
          commandPhase, claimedRevision, events

vars == <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
          rootPhase, childPhase, waitPath,
          outbox, dispatched, pendingObservation,
          observedEffects, appliedEffects,
          commandPhase, claimedRevision, events>>

TypeOK ==
  /\ artifacts \subseteq Revisions
  /\ ledgerRevision \in Revisions
  /\ ledgerHistory \in Seq(Revisions)
  /\ stagedRevision \in Revisions \cup {NoRevision}
  /\ rootPhase \in RootPhases
  /\ childPhase \in ChildPhases
  /\ waitPath \in {<<>>, QualifiedWait}
  /\ outbox \in BOOLEAN
  /\ dispatched \in BOOLEAN
  /\ pendingObservation \in BOOLEAN
  /\ observedEffects \in 0..MaxEffects
  /\ appliedEffects \in 0..MaxEffects
  /\ commandPhase \in CommandPhases
  /\ claimedRevision \in Revisions \cup {NoRevision}
  /\ events \in Seq(EventTypes)

Init ==
  /\ artifacts = {0}
  /\ ledgerRevision = 0
  /\ ledgerHistory = <<0>>
  /\ stagedRevision = NoRevision
  /\ rootPhase = "running"
  /\ childPhase = "running"
  /\ waitPath = <<>>
  /\ outbox = FALSE
  /\ dispatched = FALSE
  /\ pendingObservation = FALSE
  /\ observedEffects = 0
  /\ appliedEffects = 0
  /\ commandPhase = "none"
  /\ claimedRevision = NoRevision
  /\ events = <<"runStarted">>

(***************************************************************************)
(* The child first reaches a private wait. The root does not advertise that *)
(* wait until the encrypted root continuation has been written and its     *)
(* pointer has been published.                                             *)
(***************************************************************************)
BeginSuspension ==
  /\ rootPhase = "running"
  /\ childPhase = "running"
  /\ commandPhase = "none"
  /\ rootPhase' = "suspending"
  /\ childPhase' = "suspended"
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  waitPath, outbox, dispatched, pendingObservation,
                  observedEffects, appliedEffects, commandPhase,
                  claimedRevision, events>>

WriteCheckpoint ==
  /\ rootPhase \in {"running", "suspending"}
  /\ stagedRevision = NoRevision
  /\ ledgerRevision < MaxRevision
  /\ artifacts' = artifacts \cup {ledgerRevision + 1}
  /\ stagedRevision' = ledgerRevision + 1
  /\ UNCHANGED <<ledgerRevision, ledgerHistory, rootPhase, childPhase,
                  waitPath, outbox, dispatched, pendingObservation,
                  observedEffects, appliedEffects, commandPhase,
                  claimedRevision, events>>

PublishCheckpoint ==
  /\ stagedRevision = ledgerRevision + 1
  /\ stagedRevision \in artifacts
  /\ commandPhase = "none"
  /\ ledgerRevision' = stagedRevision
  /\ ledgerHistory' = Append(ledgerHistory, stagedRevision)
  /\ stagedRevision' = NoRevision
  /\ IF rootPhase = "suspending"
        THEN /\ rootPhase' = "suspended"
             /\ childPhase' = "suspended"
             /\ waitPath' = QualifiedWait
             /\ events' = Append(events, "runSuspended")
        ELSE /\ UNCHANGED <<rootPhase, childPhase, waitPath, events>>
  /\ UNCHANGED <<artifacts, outbox, dispatched, pendingObservation,
                  observedEffects, appliedEffects, commandPhase,
                  claimedRevision>>

ClaimResume ==
  /\ rootPhase = "suspended"
  /\ waitPath = QualifiedWait
  /\ commandPhase = "none"
  /\ commandPhase' = "claimed"
  /\ claimedRevision' = ledgerRevision
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  rootPhase, childPhase, waitPath, outbox, dispatched,
                  pendingObservation, observedEffects, appliedEffects, events>>

ApplyResume ==
  /\ rootPhase = "suspended"
  /\ childPhase = "suspended"
  /\ waitPath = QualifiedWait
  /\ commandPhase = "claimed"
  /\ claimedRevision = ledgerRevision
  /\ rootPhase' = "running"
  /\ childPhase' = "running"
  /\ waitPath' = <<>>
  /\ commandPhase' = "applied"
  /\ events' = Append(events, "runResumed")
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  outbox, dispatched, pendingObservation, observedEffects,
                  appliedEffects, claimedRevision>>

ClearCommand ==
  /\ commandPhase = "applied"
  /\ commandPhase' = "none"
  /\ claimedRevision' = NoRevision
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  rootPhase, childPhase, waitPath, outbox, dispatched,
                  pendingObservation, observedEffects, appliedEffects, events>>

(***************************************************************************)
(* An effect crosses the trust boundary in four visible stages. A crash may *)
(* stutter between stages; no stage relies on volatile-only information.   *)
(***************************************************************************)
WriteOutbox ==
  /\ rootPhase = "running"
  /\ appliedEffects < MaxEffects
  /\ ~outbox
  /\ ~pendingObservation
  /\ outbox' = TRUE
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  rootPhase, childPhase, waitPath, dispatched,
                  pendingObservation, observedEffects, appliedEffects,
                  commandPhase, claimedRevision, events>>

DispatchEffect ==
  /\ rootPhase = "running"
  /\ outbox
  /\ ~dispatched
  /\ dispatched' = TRUE
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  rootPhase, childPhase, waitPath, outbox,
                  pendingObservation, observedEffects, appliedEffects,
                  commandPhase, claimedRevision, events>>

ObserveEffect ==
  /\ dispatched
  /\ ~pendingObservation
  /\ observedEffects < MaxEffects
  /\ pendingObservation' = TRUE
  /\ observedEffects' = observedEffects + 1
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  rootPhase, childPhase, waitPath, outbox, dispatched,
                  appliedEffects, commandPhase, claimedRevision, events>>

ApplyEffect ==
  /\ pendingObservation
  /\ appliedEffects < observedEffects
  /\ pendingObservation' = FALSE
  /\ outbox' = FALSE
  /\ dispatched' = FALSE
  /\ appliedEffects' = appliedEffects + 1
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  rootPhase, childPhase, waitPath, observedEffects,
                  commandPhase, claimedRevision, events>>

Complete ==
  /\ rootPhase = "running"
  /\ childPhase = "running"
  /\ appliedEffects = MaxEffects
  /\ ~outbox
  /\ ~pendingObservation
  /\ commandPhase = "none"
  /\ rootPhase' = "completed"
  /\ childPhase' = "completed"
  /\ events' = Append(events, "runCompleted")
  /\ UNCHANGED <<artifacts, ledgerRevision, ledgerHistory, stagedRevision,
                  waitPath, outbox, dispatched, pendingObservation,
                  observedEffects, appliedEffects, commandPhase,
                  claimedRevision>>

Next ==
  \/ BeginSuspension
  \/ WriteCheckpoint
  \/ PublishCheckpoint
  \/ ClaimResume
  \/ ApplyResume
  \/ ClearCommand
  \/ WriteOutbox
  \/ DispatchEffect
  \/ ObserveEffect
  \/ ApplyEffect
  \/ Complete

Spec == Init /\ [][Next]_vars

StrictlyIncreasing(sequence) ==
  \A index \in 1..(Len(sequence) - 1) :
    sequence[index] < sequence[index + 1]

LedgerPointsToDurableArtifact == ledgerRevision \in artifacts
LedgerRevisionIsMonotone == StrictlyIncreasing(ledgerHistory)
DispatchRequiresOutbox == dispatched => outbox
ApplyRequiresObservation == appliedEffects <= observedEffects
SuspensionIsDurable ==
  rootPhase = "suspended" =>
    /\ ledgerRevision > 0
    /\ ledgerRevision \in artifacts
    /\ waitPath = QualifiedWait
ExactQualifiedWait == (rootPhase = "suspended") <=> (waitPath = QualifiedWait)
CommandIsRevisionFenced ==
  commandPhase \in {"claimed", "applied"} => claimedRevision = ledgerRevision
RunStartsFirst == Len(events) > 0 /\ Head(events) = "runStarted"

Safety ==
  /\ TypeOK
  /\ LedgerPointsToDurableArtifact
  /\ LedgerRevisionIsMonotone
  /\ DispatchRequiresOutbox
  /\ ApplyRequiresObservation
  /\ SuspensionIsDurable
  /\ ExactQualifiedWait
  /\ CommandIsRevisionFenced
  /\ RunStartsFirst

=============================================================================
