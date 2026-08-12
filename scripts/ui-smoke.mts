import { SignJWT } from "jose";
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (n: string, c: boolean, d = "") => { if (c) { pass++; console.log(`  PASS  ${n}`); } else { fail++; console.log(`  FAIL  ${n}  ${d}`); } };

class Jar {
  private c = new Map<string, string>();
  take(res: Response) {
    for (const h of res.headers.getSetCookie?.() ?? []) {
      const [pair] = h.split(";");
      const i = pair?.indexOf("=") ?? -1;
      if (i > 0 && pair) this.c.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }
  hdr() { return [...this.c].map(([k, v]) => `${k}=${v}`).join("; "); }
}

async function req(jar: Jar | null, path: string, init: RequestInit = {}) {
  const h = new Headers(init.headers);
  h.set("Origin", BASE);
  if (init.body && !h.has("Content-Type")) h.set("Content-Type", "application/json");
  if (jar) h.set("Cookie", jar.hdr());
  const res = await fetch(`${BASE}${path}`, { ...init, headers: h, redirect: "manual" });
  if (jar) jar.take(res);
  return res;
}

const email = `ui-${Date.now()}@example.com`;
const pw = "correct-horse-battery-staple";
const jar = new Jar();

console.log("\n[1-2] landing + pages");
const homeRes = await fetch(`${BASE}/`);
const homeHtml = await homeRes.text();
ok("GET /", homeRes.status === 200);
for (const p of ["/security", "/privacy", "/terms"]) {
  ok(`GET ${p}`, (await fetch(`${BASE}${p}`)).status === 200);
}
const waEnabled = !!(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").trim();
ok("support: wa.me link iff NEXT_PUBLIC_SUPPORT_WHATSAPP set", homeHtml.includes("wa.me") === waEnabled);

console.log("\n[3] sign up + verify");
const up = await req(null, "/api/auth/sign-up/email", { method: "POST", body: JSON.stringify({ email, password: pw, name: "UI Test" }) });
ok("sign up", up.status === 200, `got ${up.status}`);
const secret = process.env.AUTH_SECRET!;
const token = await new SignJWT({ email }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1000) + 3600).sign(new TextEncoder().encode(secret));
const vr = await fetch(`${BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=/`, { redirect: "manual" });
ok("verify email", [200, 302].includes(vr.status), `got ${vr.status}`);

console.log("\n[4] sign in");
const si = await req(null, "/api/auth/sign-in/email", { method: "POST", body: JSON.stringify({ email, password: pw }) });
ok("sign in", si.status === 200, `got ${si.status}`);
jar.take(si);

console.log("\n[5] dashboard");
const dash = await req(jar, "/dashboard");
const dashHtml = await dash.text();
ok("GET /dashboard (auth)", dash.status === 200 && dashHtml.includes("Hello"), `got ${dash.status}`);
ok("dashboard shows email", dashHtml.includes(email));
ok("support: dashboard support link iff configured", dashHtml.includes("wa.me") === waEnabled);
const anonDash = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
ok("anon /dashboard -> /login", anonDash.status === 307 && (anonDash.headers.get("location") ?? "").includes("/login"));
const loggedInLogin = await req(jar, "/login");
ok("logged-in /login -> /dashboard", loggedInLogin.status === 307 && (loggedInLogin.headers.get("location") ?? "").includes("/dashboard"), `got ${loggedInLogin.status} ${loggedInLogin.headers.get("location")}`);

console.log("\n[6-9] new conversation + message + stream");
const conv = await req(jar, "/api/conversations", { method: "POST", body: "{}" });
const convBody = await conv.json();
ok("create conversation", conv.status === 201, `got ${conv.status}`);
const chatPage = await req(jar, `/chat/${convBody.id}`);
const chatHtml = await chatPage.text();
ok("GET /chat/[id]", chatPage.status === 200 && chatHtml.includes("Message WAIon"), `got ${chatPage.status}`);
const stream = await req(jar, `/api/chat?stream=1`, { method: "POST", body: JSON.stringify({ conversationId: convBody.id, content: "Say exactly: STORED-OK" }) });
const text = await stream.text();
ok("stream has delta + done", text.includes('"type":"delta"') && text.includes('"type":"done"'), "no done event");
ok("stream is SSE", (stream.headers.get("content-type") ?? "").includes("text/event-stream"));

console.log("\n[10-11] persistence after refresh");
const msgs = await req(jar, `/api/messages?conversationId=${convBody.id}`);
const msgsBody = await msgs.json();
ok("2 messages persisted", Array.isArray(msgsBody) && msgsBody.length === 2, `got ${JSON.stringify(msgsBody).slice(0, 80)}`);
ok("assistant content stored", msgsBody.some((m: { role: string }) => m.role === "assistant"));
const dash2 = await req(jar, "/dashboard");
const dash2Html = await dash2.text();
ok("dashboard shows conversation after refresh", dash2Html.includes("Say exactly"), "title not found");
const chat2 = await req(jar, `/chat/${convBody.id}`);
const chat2Html = await chat2.text();
ok("chat page loads full history", chat2Html.includes("STORED-OK") || chat2Html.includes("Say exactly"), "history not found");

console.log("\n[12-13] continue conversation");
const cont = await req(jar, "/api/chat", { method: "POST", body: JSON.stringify({ conversationId: convBody.id, content: "And now reply: MORE-OK" }) });
ok("continue conversation", cont.status === 200, `got ${cont.status}`);

console.log("\n[14] delete conversation");
const del = await req(jar, `/api/conversations/${convBody.id}`, { method: "DELETE" });
ok("delete conversation", del.status === 204, `got ${del.status}`);
const gone = await req(jar, `/chat/${convBody.id}`);
ok("deleted chat page -> 404", gone.status === 404, `got ${gone.status}`);
const dash3 = await req(jar, "/dashboard");
ok("dashboard no longer shows it", !(await dash3.text()).includes("Say exactly"));

console.log("\n[15-17] logout -> login again -> history");
const out = await req(jar, "/api/auth/sign-out", { method: "POST", body: "{}" });
ok("sign out", out.status === 200, `got ${out.status}`);
const sess = await req(jar, "/api/auth/get-session");
ok("session gone", (await sess.json()) === null);

// Fresh session like a real browser would have after signing in again.
const jar2 = new Jar();
const si2 = await req(null, "/api/auth/sign-in/email", { method: "POST", body: JSON.stringify({ email, password: pw }) });
ok("sign in again", si2.status === 200, `got ${si2.status}`);
jar2.take(si2);
const conv2 = await req(jar2, "/api/conversations", { method: "POST", body: "{}" });
const conv2Body = await conv2.json();
ok("create conversation after re-login", conv2.status === 201 && typeof conv2Body.id === "string", `got ${conv2.status}`);
const send2 = await req(jar2, "/api/chat", { method: "POST", body: JSON.stringify({ conversationId: conv2Body.id, content: "History check message" }) });
ok("send message after re-login", send2.status === 200, `got ${send2.status}`);
const dash4 = await req(jar2, "/dashboard");
ok("history persists after re-login", (await dash4.text()).includes("History check message"));

console.log(`\n=== UI SMOKE: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
