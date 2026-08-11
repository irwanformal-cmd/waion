"use client";

import { useState } from "react";

export function VerificationStatus() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function resend() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.ok) {
        setMessage({
          kind: "ok",
          text: "Verification email sent. In dev, the link is printed in the server log.",
        });
      } else {
        setMessage({
          kind: "error",
          text:
            res.status === 429
              ? "Too many attempts. Please wait a minute."
              : "Could not send the verification email. Try again later.",
        });
      }
    } catch {
      setMessage({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="text-zinc-500">Email</span>
      <span className="text-zinc-300">not verified</span>
      <button
        onClick={resend}
        disabled={busy}
        className="text-emerald-400 hover:underline disabled:opacity-60"
      >
        {busy ? "Sending..." : "Send verification email"}
      </button>
      {message ? (
        <span
          role="status"
          className={`w-full text-xs ${
            message.kind === "ok" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {message.text}
        </span>
      ) : null}
    </div>
  );
}