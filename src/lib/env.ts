import "server-only";
import { z } from "zod";
import { AI_PROVIDERS } from "@wai/shared";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((v) => v.startsWith("postgresql://") || v.startsWith("postgres://"), {
      message: "DATABASE_URL must be a postgres:// connection string",
    }),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 chars (openssl rand -base64 32)"),
  AI_PROVIDER: z.enum(AI_PROVIDERS).default("openai"),
  AI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  AI_API_KEY: z.string().default(""),
  AI_BASE_URL: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM: z.string().default(""),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  TRUSTED_ORIGINS: z.string().default(""),
  FREE_DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().default(100_000),
  MAX_REQUEST_TOKENS: z.coerce.number().int().positive().default(16_000),
  MAX_MESSAGE_LENGTH: z.coerce.number().int().positive().max(16_000).default(16_000),
  CHAT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  SIGN_UP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug"]).default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[env] Invalid or missing environment variables:",
    parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
  );
  throw new Error("Invalid environment configuration. Check .env.local");
}

export const env = parsed.data;

export const trustedOrigins = env.TRUSTED_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);