import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  apiErrorResponse,
  ensureSameOrigin,
  unauthenticated,
  validationError,
} from "@/lib/api/bff";
import { laravelFetch } from "@/lib/api/laravel";
import { getSessionToken } from "@/lib/auth/session";

const realtimeAuthSchema = z.object({
  socket_id: z.string().min(1),
  channel_name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const originError = ensureSameOrigin(request);
  if (originError) return originError;

  const token = await getSessionToken();
  if (!token) return unauthenticated();

  const body: unknown = await request.json().catch(() => null);
  const parsed = realtimeAuthSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const { data, status } = await laravelFetch<Record<string, unknown>>(
      "/api/broadcasting/auth",
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
