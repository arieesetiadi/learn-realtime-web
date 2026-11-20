import { ApiError, parseErrorResponse } from "./errors";

type ApiFetchOptions = RequestInit & {
  redirectOn401?: boolean;
};

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { redirectOn401 = true, headers, ...init } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (init.body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(resolveUrl(path), {
      ...init,
      headers: requestHeaders,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(502, "network_error", "Unable to reach the server.");
  }

  if (!response.ok) {
    const error = await parseErrorResponse(response);

    if (response.status === 401 && redirectOn401) {
      try {
        await fetch(resolveUrl("/api/auth/logout"), {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // The redirect still clears stale client state if the logout call fails.
      }

      window.location.assign(window.location.origin + "/login");
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
