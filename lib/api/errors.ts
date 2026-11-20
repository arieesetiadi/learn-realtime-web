type ApiErrorOptions = {
  requestId?: string | null;
  errors?: Record<string, string[]>;
  retryAfter?: number;
};

export class ApiError extends Error {
  status: number;
  code: string;
  requestId: string | null;
  errors?: Record<string, string[]>;
  retryAfter?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    options: ApiErrorOptions = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = options.requestId ?? null;
    this.errors = options.errors;
    this.retryAfter = options.retryAfter;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isErrorMap(value: unknown): value is Record<string, string[]> {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (entry) =>
        Array.isArray(entry) &&
        entry.every((message) => typeof message === "string"),
    )
  );
}

function parseRetryAfter(headers: Headers): number | undefined {
  const value = headers.get("Retry-After");
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;

  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

export async function parseErrorResponse(
  response: Response,
): Promise<ApiError> {
  const retryAfter = parseRetryAfter(response.headers);
  const body: unknown = await response.json().catch(() => null);
  const payload = isRecord(body) ? body : null;

  const message =
    typeof payload?.message === "string"
      ? payload.message
      : response.statusText || "Request failed.";
  const code = typeof payload?.code === "string" ? payload.code : "http_error";
  const requestId =
    typeof payload?.request_id === "string" ? payload.request_id : null;
  const errors = isErrorMap(payload?.errors) ? payload.errors : undefined;

  return new ApiError(response.status, code, message, {
    requestId,
    errors,
    retryAfter,
  });
}


