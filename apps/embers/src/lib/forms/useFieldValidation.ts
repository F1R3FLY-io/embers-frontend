import { useState } from "react";

import { focusFirstError } from "./useForm";

/** Shared validation for dialogs whose fields are not managed by TanStack. */
export function useFieldValidation(
  checks: Record<string, () => string | undefined>,
) {
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const errors = Object.fromEntries(
    Object.entries(checks).map(([name, check]) => {
      try {
        return [name, check()];
      } catch (error) {
        return [
          name,
          error instanceof Error ? error.message : "Enter a valid value.",
        ];
      }
    }),
  ) as Record<string, string | undefined>;
  return {
    errors,
    nativeProps(name: string) {
      return {
        "aria-describedby":
          touched.has(name) && errors[name] ? `${name}-error` : undefined,
        "aria-invalid": (touched.has(name) && !!errors[name]) || undefined,
        name,
        onBlur: () => setTouched((previous) => new Set(previous).add(name)),
      };
    },
    props(name: string) {
      return {
        errorMessage: touched.has(name) ? errors[name] : undefined,
        name,
        onBlur: () => setTouched((previous) => new Set(previous).add(name)),
      };
    },
    validate() {
      setTouched(new Set(Object.keys(checks)));
      if (Object.values(errors).some(Boolean)) {
        focusFirstError();
        return false;
      }
      return true;
    },
    visible(name: string) {
      return touched.has(name) ? errors[name] : undefined;
    },
  };
}

export function integerError(
  value: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): string | undefined {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum
    ? undefined
    : `Enter a whole number between ${minimum} and ${maximum}.`;
}
