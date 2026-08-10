import "server-only";
import { env } from "@/lib/env";

interface AuthEmail {
  to: string;
  subject: string;
  text: string;
  url: string;
}

export async function sendAuthEmail({ to, subject, text, url }: AuthEmail): Promise<void> {
  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to,
        subject,
        text: `${text}\n\n${url}`,
      }),
    });
    if (!res.ok) {
      throw new Error(`email provider error: ${res.status}`);
    }
    return;
  }
  // Dev fallback: log the verification/reset URL. Never used in production
  // without a configured provider (sendAuthEmail is not called when the
  // provider is missing and requireEmailVerification is on — see auth.ts).
  console.warn(
    `[email:dev] ${subject} -> ${to}\n  ${url}\n  (RESEND_API_KEY/RESEND_FROM not set)`,
  );
}