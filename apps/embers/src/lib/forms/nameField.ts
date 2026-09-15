import z from "zod";

/**
 * The longest name an agent or a team may be given.
 *
 * A name is user-supplied text with no natural length, and it is rendered into a
 * dashboard card of a fixed 200px and into a node label in the graph editor. Left
 * unbounded it overflows the card and pushes the grid around it out of shape -- the
 * same class of defect as the sidebar's fixed height cap, where a container of fixed
 * size met content of unbounded size and the content lost silently.
 *
 * 64 is comfortably longer than any name anyone writes and short enough to lay out.
 *
 * Validation only reaches names created from now on. The card's line clamp is the
 * other half, containing the ones already stored on chain, which cannot be reached at
 * all: the record is immutable and the wallet may hold names written before this
 * existed. Neither half is sufficient alone.
 */
export const NAME_MAX_LENGTH = 64;

/** The shared rule for an agent or team name, so the two cannot drift apart. */
export const nameField = () => z.string().nonempty().max(NAME_MAX_LENGTH);
