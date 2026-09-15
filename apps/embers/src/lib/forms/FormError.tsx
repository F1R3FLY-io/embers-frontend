import { errorMessage } from "./useForm";

export function FormError({ error }: { error: unknown }) {
  const message = errorMessage(error);
  return message ? <p role="alert">{message}</p> : null;
}
