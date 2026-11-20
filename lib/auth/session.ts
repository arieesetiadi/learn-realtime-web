import "server-only";

import type { User } from "@/features/auth/types";
import { ApiError } from "@/lib/api/errors";
import { laravelFetch } from "@/lib/api/laravel";
import { readSessionToken } from "./cookies";

type UserResponse = {
  data: User | { user: User };
};

export async function getSessionToken(): Promise<string | null> {
  return readSessionToken();
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();

  if (!token) return null;

  try {
    const { data } = await laravelFetch<UserResponse>("/api/v1/user", {
      token,
    });
    const user = data.data;

    if ("user" in user) {
      return user.user;
    }

    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
