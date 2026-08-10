import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { env, trustedOrigins } from "@/lib/env";
import { sendAuthEmail } from "@/lib/email";

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg" }),
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  },
  user: {
    additionalFields: {
      // Server-controlled fields. `input: false` — clients cannot set them.
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      plan: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
    },
  },
  session: {
    // 7-day lifetime; refresh the expiry at most once per day.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    sendResetPassword: async ({ user: u, url }) => {
      await sendAuthEmail({
        to: u.email,
        subject: "Reset your password",
        text: "Use this link to reset your password. It expires in 1 hour.",
        url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user: u, url }) => {
      await sendAuthEmail({
        to: u.email,
        subject: "Verify your email address",
        text: "Confirm your email address to finish signing up.",
        url,
      });
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      // Stricter limits on the brute-force surface.
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 3600, max: env.SIGN_UP_RATE_LIMIT_MAX },
      "/forget-password": { window: 3600, max: 5 },
      "/reset-password": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 5 },
    },
  },
  logging: {
    disabled: false,
  },
});

export type SessionUser = typeof auth.$Infer.Session.user;