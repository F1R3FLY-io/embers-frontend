import { useCallback } from "react";

import { useLoader } from "@/lib/providers/loader/useLoader";

type AnyAsyncFn<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

export function useCallbackWithLoader<TArgs extends unknown[], TResult>(
  fn: AnyAsyncFn<TArgs, TResult>,
) {
  const { hide, show } = useLoader();

  return useCallback(
    async (...args: TArgs) => {
      show();
      try {
        return await fn(...args);
      } finally {
        hide();
      }
    },
    [fn, hide, show],
  );
}
