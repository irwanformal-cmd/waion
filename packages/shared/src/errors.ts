/**
 * Canonical API error contract. The server maps internal failures onto these
 * codes; clients can match on them without ever seeing stack traces or
 * internal details.
 */
export const API_ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INVALID_INPUT",
  "RATE_LIMITED",
  "QUOTA_EXCEEDED",
  "PAYLOAD_TOO_LARGE",
  "BAD_REQUEST",
  "CONFLICT",
  "INTERNAL",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const err = (value as { error?: unknown }).error;
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  const message = (err as { message?: unknown }).message;
  return (
    typeof code === "string" &&
    (API_ERROR_CODES as readonly string[]).includes(code) &&
    typeof message === "string"
  );
}

export class WaiApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, status: number) {
    super(code);
    this.name = "WaiApiError";
    this.code = code;
    this.status = status;
  }
}
