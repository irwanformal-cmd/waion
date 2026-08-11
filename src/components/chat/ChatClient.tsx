"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WaiClient, WaiApiError, type ChatUsageDto, type MessageDto } from "@wai/shared";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  meta?: string;
}

function formatTokens(n: number): string {
  return n.toLocaleString();
}

function isAuthError(err: unknown): boolean {
  return (
    err instanceof WaiApiError &&
    (err.code === "UNAUTHENTICATED" || err.status === 401)
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof WaiApiError) {
    switch (err.code) {
      case "RATE_LIMITED":
      case "QUOTA_EXCEEDED":
        return "You are out of quota right now. Try again later.";
      case "PAYLOAD_TOO_LARGE":
        return "That message is too long. Please shorten it and try again.";
      case "INVALID_INPUT":
        return "That message could not be sent. Please check it and try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Network error. Check your connection and try again.";
}

function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline underline-offset-2"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[0.85em]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950 p-3">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function toLocal(dto: MessageDto): LocalMessage {
  return {
    id: dto.id,
    role: dto.role,
    content: dto.content,
    meta:
      dto.role === "assistant"
        ? `${formatTokens(dto.tokensOut)} output tokens`
        : `${formatTokens(dto.tokensIn)} tokens`,
  };
}

export function ChatClient({
  conversationId,
  initialTitle,
  initialMessages,
}: {
  conversationId: string;
  initialTitle: string;
  initialMessages: MessageDto[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<LocalMessage[]>(
    initialMessages.map(toLocal),
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ChatUsageDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const client = new WaiClient();
    client
      .usage()
      .then((u) => {
        setUsage({
          inputTokens: u.usedTokens,
          outputTokens: 0,
          usedTokensToday: u.usedTokens,
          budgetTokens: u.budgetTokens,
        });
      })
      .catch((err: unknown) => {
        if (isAuthError(err)) {
          router.replace("/login");
        }
      });
  }, [router]);

  async function createNewChat() {
    try {
      const client = new WaiClient();
      const conversation = await client.createConversation();
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      if (isAuthError(err)) {
        router.replace("/login");
        return;
      }
      setError(errorMessage(err));
    }
  }

  async function deleteConversation() {
    setDeleting(true);
    try {
      await new WaiClient().deleteConversation(conversationId);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setDeleting(false);
      if (isAuthError(err)) {
        router.replace("/login");
        return;
      }
      setError("Failed to delete this conversation. Please try again.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    setDraft("");
    setError(null);
    setBusy(true);

    const userMsg: LocalMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessages((prev) => [
      ...prev,
      { id: `local-stream-${Date.now()}`, role: "assistant", content: "", streaming: true },
    ]);

    const client = new WaiClient();
    try {
      await client.chatStream(
        { conversationId, content },
        (event) => {
          if (event.type === "delta") {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.streaming) {
                copy[copy.length - 1] = { ...last, content: last.content + event.text };
              }
              return copy;
            });
          } else if (event.type === "done") {
            setUsage(event.usage);
            setMessages((prev) => {
              const copy = prev.map((m) =>
                m.streaming
                  ? {
                      ...m,
                      streaming: false,
                      meta: `${formatTokens(event.usage.outputTokens)} output tokens`,
                    }
                  : m,
              );
              return copy;
            });
          } else if (event.type === "error") {
            setError(event.message);
          }
        },
      );
    } catch (err) {
      if (isAuthError(err)) {
        router.replace("/login");
        return;
      }
      setError(errorMessage(err));
    } finally {
      // Remove the streaming placeholder if the stream ended without a
      // "done" event (failed or aborted), keep everything else.
      setMessages((prev) => prev.filter((m) => !m.streaming));
      setBusy(false);
      textareaRef.current?.focus();
    }
  }

  const pct = usage
    ? Math.min(100, Math.round((usage.usedTokensToday / usage.budgetTokens) * 100))
    : 0;

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-200"
            aria-label="Back to dashboard"
          >
            <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="truncate text-sm font-medium text-zinc-200">
            {initialTitle}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden text-zinc-500 sm:inline">Delete?</span>
              <button
                onClick={deleteConversation}
                disabled={deleting}
                className="rounded-md bg-red-600 px-2 py-1 font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                No
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                aria-label="Delete conversation"
                title="Delete conversation"
                className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
              >
                <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
              <button
                onClick={createNewChat}
                disabled={busy}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                <span className="hidden sm:inline">New chat</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-zinc-400">Start a new conversation.</p>
            <p className="max-w-sm text-xs text-zinc-600">
              Ask a question, paste a document excerpt, or request a draft.
              Responses stream in as markdown.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "border border-zinc-800 bg-zinc-900/70 text-zinc-300"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose-invert text-sm leading-relaxed">
                      <Markdown content={m.content || "..."} />
                      {m.streaming ? (
                        <span className="ml-0.5 inline-flex gap-1" aria-label="Thinking">
                          <span className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
                          <span className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
                          <span className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {m.content}
                    </p>
                  )}
                  {m.meta ? (
                    <div className={`mt-2 text-xs ${m.role === "user" ? "text-emerald-100" : "text-zinc-600"}`}>
                      {m.meta}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <p role="alert" className="pb-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} className="border-t border-zinc-800 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(e);
              }
            }}
            rows={1}
            maxLength={16000}
            placeholder="Message WAIon..."
            disabled={busy}
            className="max-h-40 min-h-10 flex-1 resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="h-10 shrink-0 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {usage ? (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.max(pct, 1)}%` }}
            />
          </div>
        ) : null}
      </form>
    </>
  );
}
