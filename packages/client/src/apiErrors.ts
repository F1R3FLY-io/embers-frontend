import type { Middleware } from "./api-client/runtime";

export class ApiError extends Error {
  public constructor(
    message: string,
    public status = 0,
    public fields: Record<string, string[]> = {},
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function responseError(response: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await response.clone().json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    /* A proxy may return HTML. */
  }
  const fields: Record<string, string[]> = {};
  if (body.field_errors && typeof body.field_errors === "object") {
    for (const [key, value] of Object.entries(body.field_errors)) {
      fields[
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
      ] = Array.isArray(value)
        ? value.filter(
            (message): message is string => typeof message === "string",
          )
        : typeof value === "string"
          ? [value]
          : [];
    }
  }
  const description =
    typeof body.description === "string"
      ? body.description
      : typeof body.message === "string"
        ? body.message
        : `Request failed (HTTP ${response.status}). Please try again.`;
  return new ApiError(
    description,
    response.status,
    fields,
    typeof body.code === "string" ? body.code : undefined,
  );
}

export async function normalizeApiError(error: unknown): Promise<ApiError> {
  if (error instanceof ApiError) {
    return error;
  }
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response instanceof Response
  ) {
    return responseError(error.response);
  }
  return new ApiError(
    error instanceof Error
      ? error.message
      : "The request failed. Please try again.",
  );
}

export const apiErrorMiddleware: Middleware = {
  async post({ response }) {
    if (!response.ok) {
      throw await responseError(response);
    }
    return response;
  },
};
