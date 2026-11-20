import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const TOKEN_COOKIE = "laravel_api_token";
const MAX_AGE = 60 * 60 * 24 * 30;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export async function readSessionToken(): Promise<string | null> {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: token,
    ...cookieOptions(),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: "",
    ...cookieOptions(),
    maxAge: 0,
  });
}
