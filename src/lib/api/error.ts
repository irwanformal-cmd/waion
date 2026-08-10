import type { ApiErrorCode } from "@wai/shared";

/**
 * Server-side error type. `detail` is logged only and NEVER sent to clients;
 * clients receive the shared { error: { code, message } } contract.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly detail?: string;

  constructor(code: ApiErrorCode, status: number, detail?: string) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export function toSafeResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json(
      { error: { code: err.code, message: safeMessage(err.code) } },
      { status: err.status },
    );
  }
  // Unknown error: never leak internals.
  return Response.json(
    { error: { code: "INTERNAL", message: "Internal server error" } },
    { status: 500 },
  );
}

function safeMessage(code: ApiErrorCode): string {
  switch (code) {
    case "UNAUTHENTICATED":
      return "Authentication required";
    case "FORBIDDEN":
      return "You don't have permission to do that";
    case "NOT_FOUND":
      return "Not found";
    case "INVALID_INPUT":
      return "Invalid input";
    case "RATE_LIMITED":
      return "Too many requests. Try again later.";
    case "QUOTA_EXCEEDED":
      return "Daily usage limit reached";
    case "PAYLOAD_TOO_LARGE":
      return "Payload too large";
    case "BAD_REQUEST":
      return "Bad request";
    case "CONFLICT":
      return "Conflict with existing data";
    case "INTERNAL":
      return "Internal server error";
  }
}
