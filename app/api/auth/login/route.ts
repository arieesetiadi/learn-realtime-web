import { NextResponse, type NextRequest } from "next/server";

import { loginSchema } from "@/features/auth/schemas";
import type { User } from "@/features/auth/types";
import {
  apiErrorResponse,
  ensureSameOrigin,
  validationError,
} from "@/lib/api/bff";
import { laravelFetch } from "@/lib/api/laravel";
import { setSessionCookie } from "@/lib/auth/cookies";

type LoginResponse = {
  data: {
    token: string;
    user: User;
  };
};

export async function POST(request: NextRequest) {
  const originError = ensureSameOrigin(request);
  if (originError) return originError;

  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const { data } = await laravelFetch<LoginResponse>("/api/v1/login", {
      method: "POST",
      body: parsed.data,
      signal: request.signal,
    });
    const { token, user } = data.data;

    if (!token) {
      return NextResponse.json(
        {
          message: "The authentication response did not include a token.",
          code: "invalid_auth_response",
          request_id: null,
        },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ data: { user } });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
