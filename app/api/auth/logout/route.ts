import { NextResponse, type NextRequest } from "next/server";

import { ensureSameOrigin } from "@/lib/api/bff";
import { laravelFetch } from "@/lib/api/laravel";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { getSessionToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const originError = ensureSameOrigin(request);
  if (originError) return originError;

  const token = await getSessionToken();

  if (token) {
    try {
      await laravelFetch("/api/v1/logout", {
        method: "POST",
        token,
        signal: request.signal,
      });
    } catch {
      // The cookie must be cleared even when the upstream logout fails.
    }
  }

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookie(response);
  return response;
}
