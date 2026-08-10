"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-60"
    >
      Log out
    </button>
  );
}
