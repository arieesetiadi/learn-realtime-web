import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import { ApiError } from "./errors";

export function ensureSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      {
        message: "Forbidden.",
        code: "forbidden",
        request_id: null,
      },
      { status: 403 },
    );
  }

  return null;
}

export function unauthenticated(): NextResponse {
  return NextResponse.json(
    {
      message: "Unauthenticated.",
      code: "unauthenticated",
      request_id: null,
    },
    { status: 401 },
  );
}

export function validationError(error: ZodError): NextResponse {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string") {
      errors[field] = [...(errors[field] ?? []), issue.message];
    }
  }

  return NextResponse.json(
    {
      message: "The given data was invalid.",
      code: "validation_failed",
      request_id: null,
      errors,
    },
    { status: 422 },
  );
}

export function invalidJson(): NextResponse {
  return NextResponse.json(
    {
      message: "The request body must be valid JSON.",
      code: "validation_failed",
      request_id: null,
      errors: {},
    },
    { status: 422 },
  );
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    const headers = new Headers();

    if (error.retryAfter !== undefined) {
      headers.set("Retry-After", String(error.retryAfter));
    }

    return NextResponse.json(
      {
        message: error.message,
        code: error.code,
        request_id: error.requestId,
        ...(error.errors ? { errors: error.errors } : {}),
      },
      { status: error.status, headers },
    );
  }

  return NextResponse.json(
    {
      message: "The API request failed.",
      code: "server_error",
      request_id: null,
    },
    { status: 502 },
  );
}
