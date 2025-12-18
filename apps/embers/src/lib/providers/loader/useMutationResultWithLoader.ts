import type { UseMutationResult } from "@tanstack/react-query";

import { useCallback } from "react";

import { useLoader } from "@/lib/providers/loader/useLoader";

export function useMutationResultWithLoader<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(mutation: UseMutationResult<TData, TError, TVariables, TContext>) {
  const { hide, show } = useLoader();

  const mutate: typeof mutation.mutate = useCallback(
    (variables, options) => {
      show();
      mutation.mutate(variables, {
        ...options,
        onSettled: (...args) => {
          try {
            options?.onSettled?.(...args);
          } finally {
            hide();
          }
        },
      });
    },
    [hide, mutation, show],
  );

  const mutateAsync: typeof mutation.mutateAsync = useCallback(
    async (variables, options) => {
      show();
      try {
        return await mutation.mutateAsync(variables, options);
      } finally {
        hide();
      }
    },
    [hide, mutation, show],
  );

  return { ...mutation, mutate, mutateAsync };
}
