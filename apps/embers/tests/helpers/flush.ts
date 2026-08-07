/**
 * Lets every pending microtask and zero-delay timer run.
 *
 * The flows under test are chains of awaits with no rendered output to wait on
 * -- a delete asks a reader, then a dialog, then a mutation -- so there is
 * nothing for `waitFor` to poll. Yielding to the macrotask queue lets the whole
 * chain advance, and calling it twice covers a continuation that schedules
 * another one.
 *
 * Prefer Testing Library's `waitFor` whenever the assertion is about the DOM;
 * this is for the promise plumbing behind it.
 */
export async function flush(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}
