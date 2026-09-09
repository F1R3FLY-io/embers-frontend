import { normalizeApiError } from "@f1r3fly-io/embers-client-sdk";
import { useForm as useTanstackForm } from "@tanstack/react-form";

export function errorMessage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value || undefined;
  }
  if (Array.isArray(value)) {
    return (
      [...new Set(value.map(errorMessage).filter(Boolean))].join(" ") ||
      undefined
    );
  }
  if (value && typeof value === "object") {
    if ("message" in value) {
      return errorMessage(value.message);
    }
    if ("form" in value) {
      return errorMessage(value.form);
    }
  }
  return undefined;
}

export function fieldError(meta: {
  errors: unknown[];
  isTouched: boolean;
}): string | undefined {
  return meta.isTouched ? errorMessage(meta.errors) : undefined;
}

export function focusFirstError() {
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
  );
}

// Retain TanStack's complete generic call signature so each form still infers
// its own values, validators, and field paths.
export const useForm: typeof useTanstackForm = ((
  options: Parameters<typeof useTanstackForm>[0],
) =>
  useTanstackForm({
    ...options,
    async onSubmit(context) {
      context.formApi.setErrorMap({});
      try {
        await options?.onSubmit?.(context);
      } catch (failure) {
        const error = await normalizeApiError(failure);
        context.formApi.setErrorMap({
          onServer: { fields: error.fields, form: error.message },
        } as never);
        focusFirstError();
      }
    },
    onSubmitInvalid(context) {
      options?.onSubmitInvalid?.(context);
      focusFirstError();
    },
  })) as typeof useTanstackForm;
