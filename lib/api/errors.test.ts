import { describe, expect, it } from "vitest";

import { ApiError, parseErrorResponse } from "./errors";

describe("parseErrorResponse", () => {
  it("maps the API error contract", async () => {
    const response = new Response(
      JSON.stringify({
        message: "The given data was invalid.",
        code: "validation_failed",
        request_id: "req_123",
        errors: {
          email: ["The email field is required."],
        },
      }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      },
    );

    const error = await parseErrorResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_failed");
    expect(error.message).toBe("The given data was invalid.");
    expect(error.requestId).toBe("req_123");
    expect(error.errors?.email).toEqual(["The email field is required."]);
  });

  it("reads Retry-After from a 429 response", async () => {
    const response = new Response(
      JSON.stringify({
        message: "Too many requests.",
        code: "rate_limited",
        request_id: null,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "30",
        },
      },
    );

    const error = await parseErrorResponse(response);

    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(30);
    expect(error.requestId).toBeNull();
  });
});
