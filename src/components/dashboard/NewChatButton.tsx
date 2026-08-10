"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WaiClient } from "@wai/shared";

export function NewChatButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function createChat() {
    setBusy(true);
    try {
      const client = new WaiClient();
      const conversation = await client.createConversation();
      router.push(`/chat/${conversation.id}`);
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={createChat}
      disabled={busy}
      className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      New chat
    </button>
  );
}
