import { ApiError, normalizeApiError, responseError } from "../src/apiErrors";

it("maps backend field names and preserves all validation messages", async () => {
  const response = new Response(
    JSON.stringify({
      code: "invalid_publication",
      description: "Review these fields.",
      field_errors: {
        handle: "Add a suffix",
        pds_url: ["Cannot connect", "Use HTTPS"],
      },
    }),
    { status: 422 },
  );
  const error = await responseError(response);
  expect(error).toBeInstanceOf(ApiError);
  expect(error.fields).toEqual({
    handle: ["Add a suffix"],
    pdsUrl: ["Cannot connect", "Use HTTPS"],
  });
  expect(error.status).toBe(422);
  expect(await response.json()).toHaveProperty("code", "invalid_publication");
});

it.each(["null", "[]", "<html>Proxy unavailable</html>"])(
  "handles non-object error bodies: %s",
  async (body) => {
    expect(
      (await responseError(new Response(body, { status: 502 }))).message,
    ).toContain("HTTP 502");
  },
);

it("keeps normalized errors and explains network failures", async () => {
  const original = new ApiError("Correct the handle", 422, {
    handle: ["Invalid"],
  });
  expect(await normalizeApiError(original)).toBe(original);
  expect(
    (await normalizeApiError(new TypeError("Network unavailable"))).message,
  ).toBe("Network unavailable");
});
