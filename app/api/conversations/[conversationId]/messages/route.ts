import { NextResponse, type NextRequest } from "next/server";

import { sendMessageSchema } from "@/features/messages/schemas";
import {
  apiErrorResponse,
  ensureSameOrigin,
  unauthenticated,
  validationError,
} from "@/lib/api/bff";
import { laravelFetch } from "@/lib/api/laravel";
import { getSessionToken } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

function parseConversationId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function notFound(): NextResponse {
  return NextResponse.json(
    {
      message: "Not Found.",
      code: "not_found",
      request_id: null,
    },
    { status: 404 },
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const token = await getSessionToken();
  if (!token) return unauthenticated();

  const { conversationId } = await context.params;
  const id = parseConversationId(conversationId);
  if (!id) return notFound();

  const cursor = request.nextUrl.searchParams.get("cursor");
  const path = cursor
    ? `/api/v1/conversations/${id}/messages?cursor=${encodeURIComponent(cursor)}`
    : `/api/v1/conversations/${id}/messages`;

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

export async function POST(request: NextRequest, context: RouteContext) {
  const originError = ensureSameOrigin(request);
  if (originError) return originError;

  const token = await getSessionToken();
  if (!token) return unauthenticated();

  const { conversationId } = await context.params;
  const id = parseConversationId(conversationId);
  if (!id) return notFound();

  const body: unknown = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const { data, status } = await laravelFetch<unknown>(
      `/api/v1/conversations/${id}/messages`,
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
