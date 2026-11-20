import { NextResponse, type NextRequest } from "next/server";

import { createConversationSchema } from "@/features/conversations/schemas";
import {
  apiErrorResponse,
  ensureSameOrigin,
  unauthenticated,
  validationError,
} from "@/lib/api/bff";
import { laravelFetch } from "@/lib/api/laravel";
import { getSessionToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) return unauthenticated();

  const cursor = request.nextUrl.searchParams.get("cursor");
  const path = cursor
    ? `/api/v1/conversations?cursor=${encodeURIComponent(cursor)}`
    : "/api/v1/conversations";

  try {
    const { data, status } = await laravelFetch<unknown>(path, {
      token,
      signal: request.signal,
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const originError = ensureSameOrigin(request);
  if (originError) return originError;

  const token = await getSessionToken();
  if (!token) return unauthenticated();

  const body: unknown = await request.json().catch(() => null);
  const parsed = createConversationSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const { data, status } = await laravelFetch<unknown>(
      "/api/v1/conversations",
      {
        method: "POST",
        token,
        body: parsed.data,
        signal: request.signal,
      },
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
