// Standalone better-auth config used ONLY by `@better-auth/cli generate` to
// produce the auth tables. Kept schema-relevant options in sync with the real
// app config (src/lib/auth.ts). Deliberately does not import app modules.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config as dotenv } from "dotenv";

dotenv({ path: ".env.local" });

const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL ?? "" }));

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
  },
  user: {
    additionalFields: {
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
});