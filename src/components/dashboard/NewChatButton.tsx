"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WaiClient, WaiApiError } from "@wai/shared";

export function NewChatButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createChat() {
    setBusy(true);
    setError(null);
    try {
      const client = new WaiClient();
      const conversation = await client.createConversation();
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      setBusy(false);
      if (err instanceof WaiApiError && (err.code === "UNAUTHENTICATED" || err.status === 401)) {
        router.replace("/login");
        return;
      }
      setError("Could not start a new conversation. Please try again.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={createChat}
        disabled={busy}
        className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Creating..." : "New chat"}
      </button>
      {error ? (
        <p role="alert" className="text-right text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}