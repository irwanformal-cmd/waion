/**
 * Client-safe shared constants. Nothing here may reference server-only
 * concepts (secrets, database, filesystem).
 */

export const APP_NAME = "WAIan";

export const SESSION_COOKIE_NAME = "better-auth.session_token";

/** Hard cap mirrored by the database CHECK constraint on messages.content. */
export const MAX_MESSAGE_LENGTH = 16000;

export const MAX_TITLE_LENGTH = 200;

export const DEFAULT_CONVERSATION_TITLE = "New chat";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PLAN_NAMES = ["free", "pro"] as const;
export type PlanName = (typeof PLAN_NAMES)[number];

/** AI providers understood by the server (server-side allowlist, also here for client display). */
export const AI_PROVIDERS = ["openai", "openai-compatible", "anthropic"] as const;
export type AIProviderName = (typeof AI_PROVIDERS)[number];

/** Default budget when the server does not report one. */
export const DEFAULT_DAILY_TOKEN_BUDGET = 100_000;
