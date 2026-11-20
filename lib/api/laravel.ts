import "server-only";

import { env } from "@/lib/env";
import { ApiError, parseErrorResponse } from "./errors";

type LaravelRequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

export type LaravelResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

export async function laravelFetch<T>(
  path: string,
  options: LaravelRequestOptions = {},
): Promise<LaravelResponse<T>> {
  const base = env.LARAVEL_API_URL.replace(/\/+$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const hasBody = options.body !== undefined;
  const headers = new Headers({ Accept: "application/json" });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? (hasBody ? "POST" : "GET"),
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(502, "network_error", "Unable to reach the API.");
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const text = await response.text();

  if (!text) {
    return {
      data: undefined as T,
      status: response.status,
      headers: response.headers,
    };
  }

  try {
    return {
      data: JSON.parse(text) as T,
      status: response.status,
      headers: response.headers,
    };
  } catch {
    throw new ApiError(
      502,
      "invalid_response",
      "The API returned invalid JSON.",
    );
  }
}
