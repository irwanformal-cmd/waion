import "server-only";
import { env } from "@/lib/env";

interface AuthEmail {
  to: string;
  subject: string;
  text: string;
  url: string;
}

/**
 * Dev-only email transport: logs the verification/reset URL to the server
 * log so the links are reachable without an SMTP provider.
 *
 * This function is the single integration point for a production provider
 * (e.g. Resend). When one is added later, only this function changes —
 * Better Auth's config in src/lib/auth.ts stays untouched. `.env.example`
 * already carries empty placeholders (RESEND_API_KEY, RESEND_FROM) for that
 * setup; do not fill them with real secrets.
 */
export async function sendAuthEmail({ to, subject, url }: AuthEmail): Promise<void> {
  void env.RESEND_API_KEY;
  void env.RESEND_FROM;
  console.warn(
    `[email:dev] ${subject} -> ${to}\n  ${url}\n  (RESEND_API_KEY/RESEND_FROM not set)`,
  );
}