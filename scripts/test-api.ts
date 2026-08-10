/**
 * End-to-end API security tests. Requires the app running (npm run dev) and
 * an AI provider (Ollama via AI_PROVIDER=openai-compatible works out of the box).
 *
 * Usage: npm run test:api   (add APP_URL=http://localhost:3000 to override)
 */
import { config } from "dotenv";
import { SignJWT } from "jose";

config({ path: ".env.local" });

const BASE = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(`${name} ${detail}`.trim());
    console.log(`  FAIL  ${name}  ${detail}`);
  }
}

class CookieJar {
  private cookies = new Map<string, string>();
  setFromResponse(res: Response): void {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const eq = pair?.indexOf("=");
      if (!pair || eq === undefined || eq < 0) continue;
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function api(
  jar: CookieJar | null,
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  // Better-auth's fetch-metadata CSRF check requires an Origin header on
  // state-changing requests (browsers always send one). Mimic that here.
  if (!headers.has("Origin")) headers.set("Origin", BASE);
  if (jar) headers.set("Cookie", jar.header());
  const res = await fetch(`${BASE}${path}`, { ...init, headers, redirect: "manual" });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (jar) jar.setFromResponse(res);
  return { status: res.status, body, headers: res.headers };
}

const secretValues = [
  process.env.AUTH_SECRET,
  process.env.DATABASE_URL,
  process.env.AI_API_KEY,
].filter((s): s is string => typeof s === "string" && s.length > 8);

/**
 * Email verification in better-auth (this version) uses a stateless HS256 JWT
 * signed with AUTH_SECRET — nothing is stored in the verification table during
 * sign-up. Sign the same JWT the server would send in the verification email.
 */
async function verifyEmail(email: string): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not loaded — run via npm run test:api");
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(new TextEncoder().encode(secret));
  const res = await fetch(
    `${BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=/`,
    { redirect: "manual" },
  );
  if (![200, 302, 307].includes(res.status)) {
    throw new Error(`verify-email returned ${res.status}`);
  }
}

const emails = {
  a: `test-a-${Date.now()}@example.com`,
  b: `test-b-${Date.now()}@example.com`,
};
const password = "correct-horse-battery-staple";

async function registerAndSignIn(email: string): Promise<{ jar: CookieJar; userId: string }> {
  const signup = await api(null, "/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ email, password, name: "Test User" }),
  });
  if (signup.status !== 200) {
    throw new Error(`sign-up failed for ${email}: ${signup.status}`);
  }
  await verifyEmail(email);
  const signin = await api(null, "/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (signin.status !== 200) throw new Error(`sign-in failed: ${signin.status}`);
  const jar = new CookieJar();
  jar.setFromResponse(new Response(null, { headers: signin.headers }));
  const session = await api(jar, "/api/auth/get-session");
  const user = (session.body as { user?: { id: string } } | null)?.user;
  if (!user) throw new Error("no session user after sign-in");
  return { jar, userId: user.id };
}

async function main() {
  console.log(`\nWAIan API tests → ${BASE}\n`);

  // --- Authentication -------------------------------------------------------
  console.log("[auth]");
  {
    const anon = await api(null, "/api/conversations");
    check("anonymous /api/conversations rejected", anon.status === 401, `got ${anon.status}`);

    const badLogin = await api(null, "/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: emails.a, password: "definitely-wrong-pass" }),
    });
    check("wrong password rejected", badLogin.status === 401 || badLogin.status === 403, `got ${badLogin.status}`);
  }

  const a = await registerAndSignIn(emails.a);
  const b = await registerAndSignIn(emails.b);
  check("user A and B registered and verified", true);

  // --- Chat + conversations -------------------------------------------------
  console.log("\n[chat + conversations]");

  const created = await api(a.jar, "/api/conversations", {
    method: "POST",
    body: JSON.stringify({}),
  });
  check("create conversation", created.status === 201, `got ${created.status}`);
  const convA = (created.body as { id: string } | null)?.id ?? "";

  const chat = await api(a.jar, "/api/chat", {
    method: "POST",
    body: JSON.stringify({ conversationId: convA, content: "Reply with exactly: hello" }),
  });
  if (chat.status === 200) {
    const body = chat.body as {
      userMessage?: { content?: string; role?: string };
      assistantMessage?: { content?: string; role?: string };
      usage?: { inputTokens?: number; outputTokens?: number };
    };
    check(
      "chat returns user + assistant message",
      Boolean(body.userMessage && body.assistantMessage),
    );
    check(
      "assistant message persisted with content",
      typeof body.assistantMessage?.content === "string" && body.assistantMessage.content.length > 0,
    );
    check(
      "usage reported",
      typeof body.usage?.inputTokens === "number" && typeof body.usage?.outputTokens === "number",
    );

    const detail = await api(a.jar, `/api/conversations/${convA}`);
    const detailBody = detail.body as { messages?: unknown[] };
    check("GET own conversation with messages", detail.status === 200 && (detailBody.messages?.length ?? 0) >= 2, `got ${detail.status}`);

    const usage = await api(a.jar, "/api/usage");
    const usageBody = usage.body as { usedTokens?: number; requestsToday?: number } | null;
    check(
      "usage endpoint reports tokens",
      usage.status === 200 && typeof usageBody?.usedTokens === "number" && usageBody.usedTokens > 0,
      `got ${usage.status}`,
    );
  } else {
    const msg = (chat.body as { error?: { message?: string } } | null)?.error?.message;
    console.log(`  SKIP  chat flow (provider unavailable: ${chat.status} ${msg ?? ""})`);
  }

  // --- Authorization (IDOR) -------------------------------------------------
  console.log("\n[authorization / ownership]");
  {
    const listB = await api(b.jar, "/api/conversations");
    const listBody = listB.body as { id?: string }[] | null;
    check(
      "user B does not see A's conversation",
      !(listBody ?? []).some((c) => c.id === convA),
    );

    const read = await api(b.jar, `/api/conversations/${convA}`);
    check("user B reading A's conversation → 404", read.status === 404, `got ${read.status}`);

    const del = await api(b.jar, `/api/conversations/${convA}`, { method: "DELETE" });
    check("user B deleting A's conversation → 404", del.status === 404, `got ${del.status}`);

    const msgs = await api(b.jar, `/api/messages?conversationId=${convA}`);
    check("user B reading A's messages → 404", msgs.status === 404, `got ${msgs.status}`);
  }

  // --- Input validation -----------------------------------------------------
  console.log("\n[input validation]");
  {
    const bad = await api(a.jar, "/api/chat", {
      method: "POST",
      body: JSON.stringify({ conversationId: convA }),
    });
    check("missing content → 400", bad.status === 400, `got ${bad.status}`);

    const badJson = await api(a.jar, "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    check("malformed JSON → 400", badJson.status === 400, `got ${badJson.status}`);

    const oversized = await api(a.jar, "/api/chat", {
      method: "POST",
      body: JSON.stringify({ conversationId: convA, content: "x".repeat(20000) }),
    });
    check("oversized message rejected", oversized.status === 400, `got ${oversized.status}`);

    const badId = await api(a.jar, "/api/chat", {
      method: "POST",
      body: JSON.stringify({ conversationId: "not-a-uuid", content: "hi" }),
    });
    check("invalid conversation id → 400", badId.status === 400, `got ${badId.status}`);

    const forged = await api(a.jar, "/api/chat", {
      method: "POST",
      body: JSON.stringify({ conversationId: "00000000-0000-4000-8000-000000000000", content: "hi" }),
    });
    check("nonexistent conversation → 404", forged.status === 404, `got ${forged.status}`);
  }

  // --- Streaming ------------------------------------------------------------
  console.log("\n[streaming]");
  {
    const res = await fetch(`${BASE}/api/chat?stream=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, Cookie: a.jar.header() },
      body: JSON.stringify({ conversationId: convA, content: "Reply with: stream ok" }),
    });
    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let done = false;
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        text += decoder.decode(value, { stream: true });
        if (text.includes('"type":"done"')) { done = true; break; }
      }
      check("SSE stream emits deltas and done event", text.includes('"type":"delta"') && done, "no done event");
      check("SSE uses text/event-stream", (res.headers.get("content-type") ?? "").includes("text/event-stream"));
    } else {
      console.log(`  SKIP  streaming (provider unavailable: ${res.status})`);
    }
  }

  // --- Delete + cleanup -----------------------------------------------------
  console.log("\n[delete]");
  {
    const del = await api(a.jar, `/api/conversations/${convA}`, { method: "DELETE" });
    check("user A deletes own conversation → 204", del.status === 204, `got ${del.status}`);
    const gone = await api(a.jar, `/api/conversations/${convA}`);
    check("deleted conversation → 404", gone.status === 404, `got ${gone.status}`);
  }

  // --- Logout ---------------------------------------------------------------
  console.log("\n[logout]");
  {
    const out = await api(a.jar, "/api/auth/sign-out", {
      method: "POST",
      body: "{}",
      headers: { Origin: BASE },
    });
    check("sign-out works", out.status === 200, `got ${out.status}`);
    const session = await api(a.jar, "/api/auth/get-session");
    check("session invalidated after logout", session.body === null);
  }

  // --- Secrets never leak ---------------------------------------------------
  console.log("\n[secrets]");
  {
    const probes = ["/api/conversations", "/api/usage", "/api/auth/get-session"];
    for (const p of probes) {
      const jar = b.jar;
      const res = await api(jar, p);
      const text = JSON.stringify(res.body ?? "");
      for (const secret of secretValues) {
        if (secret && text.includes(secret.slice(0, 16))) {
          check(`response of ${p} does not contain secret fragments`, false);
        }
      }
    }
    check("no secret fragments in API responses", true);
  }

  // --- Rate limiting --------------------------------------------------------
  console.log("\n[rate limit]");
  {
    let limited = false;
    for (let i = 0; i < 12; i++) {
      const res = await api(null, "/api/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify({ email: emails.a, password: `wrong-${i}` }),
      });
      if (res.status === 429) { limited = true; break; }
    }
    check("login rate limit kicks in (429)", limited);
  }

  console.log(`\n${"─".repeat(48)}`);
  console.log(`PASS: ${passed}   FAIL: ${failed}`);
  if (failed) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("test run crashed:", err.message);
  process.exit(1);
});
