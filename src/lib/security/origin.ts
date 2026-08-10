import "server-only";
import { env } from "@/lib/env";

/**
 * CSRF defense-in-depth for state-changing routes. Requests carrying the
 * session cookie must come from a trusted origin. Bearer-token requests
 * (mobile/desktop, which do not use cookies) are exempt.
 */
export function isTrustedRequest(req: Request): boolean {
  if (req.headers.has("authorization")) return true;
  const origin = req.headers.get("origin");
  if (!origin) return true; // curl, server-to-server
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  try {
    if (originUrl.origin === new URL(env.NEXT_PUBLIC_APP_URL).origin) return true;
  } catch {
    return false;
  }
  const trusted = env.TRUSTED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return trusted.includes(originUrl.origin);
}
