"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/landing/Logo";

type Mode = "login" | "register";

const GENERIC_SIGNUP_MESSAGE =
  "If this email address is not already registered, a verification link has been sent. Check your inbox (dev: see the server log).";

export function AuthCard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const path = isLogin ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
      const body: Record<string, string> = { email, password };
      if (!isLogin) body.name = name;
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (isLogin) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setNotice(
            "Account created. A verification link has been sent to your email (dev: it is printed in the server log).",
          );
        }
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { message?: string; code?: string }
        | null;

      if (res.status === 429) {
        setError("Too many attempts. Please wait a minute and try again.");
      } else if (isLogin && res.status === 403 && data?.code === "EMAIL_NOT_VERIFIED") {
        setError("Your email is not verified yet. Check your inbox for the verification link.");
      } else if (isLogin) {
        setError("Invalid email or password.");
      } else {
        setNotice(GENERIC_SIGNUP_MESSAGE);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8" aria-label="WAIan home">
        <Logo />
      </Link>

      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-xl font-semibold text-white">
          {isLogin ? "Log in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isLogin ? "Welcome back." : "Start with a free plan. No credit card required."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {!isLogin ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-zinc-400">Name</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                autoComplete="name"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-zinc-400">Email</span>
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
              autoComplete="email"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-zinc-400">Password</span>
            <input
              type="password"
              required
              minLength={10}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="text-sm text-emerald-400">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="h-10 rounded-md bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Please wait..." : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          {isLogin ? (
            <>
              No account yet?{" "}
              <Link href="/register" className="text-emerald-400 hover:underline">
                Create one
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link href="/login" className="text-emerald-400 hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
