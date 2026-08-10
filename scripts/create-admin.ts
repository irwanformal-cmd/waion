/**
 * Bootstrap admin user. Usage: npm run create-admin
 * Requires the app to be running (npm run dev) so password hashing happens
 * inside the app via better-auth — never hand-rolled crypto in scripts.
 * Prompts for email/password on stdin (never in argv, env, or logs).
 */
import { config } from "dotenv";
import readline from "node:readline/promises";
import { Pool } from "pg";
import { z } from "zod";

config({ path: ".env.local" });

async function main() {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const emailRaw = await rl.question("Admin email: ");
  const email = z.string().trim().toLowerCase().email("invalid email").parse(emailRaw);
  const password = await rl.question("Admin password (min 10 chars): ");
  z.string()
    .min(10, "password must be at least 10 characters")
    .max(128, "password too long")
    .parse(password);
  const name = "Admin";

  const res = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (res.status !== 200 && res.status !== 409) {
    console.error(
      "create-admin FAILED: sign-up request returned",
      res.status,
      await res.text(),
    );
    console.error(`Is the app running at ${baseURL}?`);
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? "",
    connectionTimeoutMillis: 5_000,
  });
  try {
    // Parameterized update — verified by DB constraints, no string SQL.
    const result = await pool.query(
      `UPDATE "user"
         SET role = 'admin', email_verified = TRUE
       WHERE email = $1`,
      [email],
    );
    if (result.rowCount === 0) {
      console.error("create-admin FAILED: user not found after sign-up");
      process.exit(1);
    }
    console.log(`Admin ready: ${email} (role=admin, email_verified=true).`);
  } finally {
    await pool.end();
    rl.close();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(
    "create-admin FAILED:",
    err instanceof z.ZodError ? err.issues[0]?.message : (err as Error).message,
  );
  process.exit(1);
});