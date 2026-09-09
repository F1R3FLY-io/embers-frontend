import type {
  ChatChannelState,
  Grant,
  MailChannelState,
  PublishedChannels,
} from "@f1r3fly-io/embers-client-sdk";

/**
 * Per-channel reachability for a team, with the three-valued discipline the
 * publish-state work established: `true` is verified reachable, `false` is a
 * verified divergence worth flagging, and `null`/`undefined` means the
 * question could not be answered -- which must be rendered as "unknown",
 * never as "missing". Mail reachability is unknown BY DESIGN (embers does not
 * probe SMTP), and the chat row is derived from grant presence because the
 * gateway dials out and exposes no status surface.
 */
export type TeamInterfaces = PublishedChannels;

export type { ChatChannelState, Grant, MailChannelState };

export type Reachability = "reachable" | "unknown" | "unreachable";

/**
 * Collapses a three-valued reachability answer into the label vocabulary the
 * interface renders. Centralized so no call site can quietly render `null` as
 * an absence.
 */
export function reachabilityOf(value: boolean | null | undefined): Reachability {
  if (value === true) {
    return "reachable";
  }
  if (value === false) {
    return "unreachable";
  }
  return "unknown";
}

/** A mail row's display state: binding activity first, probes second. */
export function mailReachability(state: MailChannelState): Reachability {
  if (!state.active) {
    return "unreachable";
  }
  return reachabilityOf(state.reachable);
}

/**
 * Chat is "reachable" exactly for the principals with active grants; with
 * none, the honest answer is unknown rather than unreachable, because a grant
 * could exist against an older deployment URI this aggregation cannot see.
 */
export function chatReachability(state: ChatChannelState): Reachability {
  return Number(state.activeGrantCount) > 0 ? "reachable" : "unknown";
}
