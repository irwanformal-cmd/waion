"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WaiClient, WaiApiError } from "@wai/shared";

export function DeleteConversationButton({
  conversationId,
  title,
  className = "",
}: {
  conversationId: string;
  title: string;
  className?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteConversation() {
    setBusy(true);
    setError(null);
    try {
      await new WaiClient().deleteConversation(conversationId);
      router.refresh();
    } catch (err) {
      setBusy(false);
      if (err instanceof WaiApiError && (err.code === "UNAUTHENTICATED" || err.status === 401)) {
        router.replace("/login");
        return;
      }
      setError("Failed to delete. Please try again.");
    }
  }

  if (confirming) {
    return (
      <div className={`flex items-center gap-1.5 text-xs ${className}`}>
        <span className="hidden text-zinc-500 md:inline">Delete?</span>
        <button
          onClick={deleteConversation}
          disabled={busy}
          aria-label={`Confirm delete ${title}`}
          className="rounded-md bg-red-600 px-2 py-1 font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {busy ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          No
        </button>
        {error ? (
          <span role="alert" className="text-red-400">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${title}`}
      title="Delete conversation"
      className={`rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400 ${className}`}
    >
      <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  );
}