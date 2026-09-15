/**
 * @jest-environment jsdom
 */
import type ReactModal from "react-modal";

import { useMutation } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react";
import { useEffect } from "react";

import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useLoader } from "@/lib/providers/loader/useLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";

import { renderWithProviders } from "./helpers/renderWithProviders";

// The busy indicator's actual contract, against the real LoaderProvider and the
// real Spinner rather than the stubs the flow suites use.
//
// Two properties matter and neither is checked anywhere else. The overlay is
// refcounted, so concurrent work must not let the first finisher clear a
// spinner the second still needs; and every wrapper must release its count on
// every exit path, because a leaked count leaves an overlay covering the page
// with no way to dismiss it -- the failure mode behind the delete-flow
// deadlock. useMutationResultWithLoader was mocked away in every suite that
// touched it and had never been tested at all.
//
// react-modal warns unless it is told which element is the app; the spinner
// renders into the body, so the body is the honest answer here.
beforeAll(() => {
  // `requireActual` hands back the CommonJS export, which IS the class --
  // there is no `default` wrapper to unwrap here.
  const reactModal = jest.requireActual<typeof ReactModal>("react-modal");
  reactModal.setAppElement(document.body);
});

/** The spinner has no text; it is identified by the overlay react-modal renders. */
const spinner = () => document.querySelector(".overlay");

function LoaderProbe({
  onReady,
}: {
  onReady: (loader: ReturnType<typeof useLoader>) => void;
}) {
  const loader = useLoader();
  useEffect(() => onReady(loader), [loader, onReady]);
  return <div data-testid="probe" />;
}

it("shows the overlay while work is in flight and hides it when the last finishes", async () => {
  let loader: ReturnType<typeof useLoader> | undefined;
  renderWithProviders(
    <LoaderProbe
      onReady={(value) => {
        loader = value;
      }}
    />,
  );

  expect(spinner()).toBeNull();

  act(() => loader?.show());
  await waitFor(() => expect(spinner()).not.toBeNull());

  // A second unit of work starts while the first is still running.
  act(() => loader?.show());
  act(() => loader?.hide());
  // One is still in flight, so the overlay must stay: this is the assertion
  // that a naive boolean flag would fail.
  expect(spinner()).not.toBeNull();

  act(() => loader?.hide());
  await waitFor(() => expect(spinner()).toBeNull());
});

it("never leaves the overlay up after more releases than acquisitions", async () => {
  let loader: ReturnType<typeof useLoader> | undefined;
  renderWithProviders(
    <LoaderProbe
      onReady={(value) => {
        loader = value;
      }}
    />,
  );

  // An extra hide (a double-release bug elsewhere) must not drive the count
  // negative, or the next show would need two hides to clear.
  act(() => loader?.hide());
  act(() => loader?.show());
  await waitFor(() => expect(spinner()).not.toBeNull());
  act(() => loader?.hide());
  await waitFor(() => expect(spinner()).toBeNull());
});

function CallbackProbe({ run }: { run: (fn: () => Promise<void>) => void }) {
  // The wrapper takes an async callback and this one rejects immediately,
  // which is the case under test: a body that throws before awaiting anything
  // must still release the overlay.
  // eslint-disable-next-line @typescript-eslint/require-await
  const failing = useCallbackWithLoader(async () => {
    throw new Error("the work failed");
  });
  useEffect(() => run(failing as () => Promise<void>), [failing, run]);
  return <div data-testid="probe" />;
}

it("releases the overlay when loader-wrapped work throws", async () => {
  let invoke: (() => Promise<void>) | undefined;
  renderWithProviders(
    <CallbackProbe
      run={(fn) => {
        invoke = fn;
      }}
    />,
  );

  await act(async () => {
    await invoke?.().catch(() => undefined);
  });

  expect(spinner()).toBeNull();
});

function MutationProbe({
  onReady,
  shouldFail,
}: {
  onReady: (api: {
    mutate: () => void;
    mutateAsync: () => Promise<string>;
  }) => void;
  shouldFail: boolean;
}) {
  const mutation = useMutationResultWithLoader(
    useMutation({
      // React Query requires a promise; this one settles without awaiting.
      // eslint-disable-next-line @typescript-eslint/require-await
      mutationFn: async () => {
        if (shouldFail) {
          throw new Error("rejected");
        }
        return "done";
      },
    }),
  );
  useEffect(
    () =>
      onReady({ mutate: mutation.mutate, mutateAsync: mutation.mutateAsync }),
    [mutation.mutate, mutation.mutateAsync, onReady],
  );
  return <div data-testid="probe" />;
}

it("releases the overlay after a rejected mutateAsync", async () => {
  let api: { mutateAsync: () => Promise<string> } | undefined;
  renderWithProviders(
    <MutationProbe
      shouldFail
      onReady={(value) => {
        api = value;
      }}
    />,
  );

  await act(async () => {
    await api?.mutateAsync().catch(() => undefined);
  });

  expect(spinner()).toBeNull();
});

// NOT ASSERTED HERE, deliberately: the case where a CALLER's own `onSettled`
// throws. The wrapper's `finally` does release the overlay -- that much was
// confirmed by hand -- but the throw escapes through react-query's notification
// batch rather than through the promise `mutate`/`mutateAsync` returns, so it
// surfaces as an unhandled rejection that no caller can catch and no assertion
// can bracket. Writing the test anyway would mean asserting against a runtime
// artifact rather than against the loader, and it would fail for a reason that
// has nothing to do with the loader. The release-on-failure contract is covered
// above on both wrappers: `useCallbackWithLoader` with a throwing body, and
// `mutateAsync` against a rejecting mutation. That a caller's callback throw
// escapes uncatchably is a separate robustness wart, recorded as its own item.

it("releases the overlay after a fire-and-forget mutate settles", async () => {
  let api: { mutate: () => void } | undefined;
  renderWithProviders(
    <MutationProbe
      shouldFail={false}
      onReady={(value) => {
        api = value;
      }}
    />,
  );

  // `mutate` returns nothing, so the release is only observable through the
  // overlay -- which is exactly how a user experiences it.
  act(() => api?.mutate());
  await waitFor(() => expect(spinner()).toBeNull());
});
