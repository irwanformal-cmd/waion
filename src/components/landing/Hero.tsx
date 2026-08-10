import Link from "next/link";

function ChatBubble({
  role,
  children,
  meta,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  meta?: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-emerald-600 text-white"
            : "rounded-bl-sm border border-zinc-800 bg-zinc-900 text-zinc-300"
        }`}
      >
        {children}
        {meta ? (
          <div
            className={`mt-2 text-xs ${isUser ? "text-emerald-100" : "text-zinc-500"}`}
          >
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto grid w-full max-w-6xl gap-16 px-4 pb-24 pt-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:px-8 lg:pt-28">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            Your AI workbench, built{" "}
            <span className="text-emerald-400">secure from day one</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Chat with leading AI models, keep every conversation saved and
            searchable, and see exactly how many tokens you use. Hardened
            authentication and server-side guardrails handle the rest.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Start chatting free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-700 px-6 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              Log in
            </Link>
          </div>

          <p className="mt-6 text-sm text-zinc-500">
            No credit card required. Free plan with a daily token budget.
            Delete your account and data anytime.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-zinc-700" />
                <span className="size-2.5 rounded-full bg-zinc-700" />
                <span className="size-2.5 rounded-full bg-zinc-700" />
              </div>
              <span className="text-xs text-zinc-500">wai.app/chat</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <ChatBubble role="user" meta="~420 tokens">
                Summarize the key clauses in this contract and flag anything
                risky.
              </ChatBubble>
              <ChatBubble role="assistant" meta="1.4s · 340 tokens used">
                <strong className="font-semibold text-zinc-100">
                  Key clauses
                </strong>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>
                    Section 4, auto-renewal: the notice window is only 30 days.
                  </li>
                  <li>
                    Section 9, liability cap of $50k may be too low for your
                    case.
                  </li>
                </ul>
                <span className="mt-2 block text-zinc-400">
                  Want me to draft counter-proposals?
                </span>
              </ChatBubble>
              <div className="flex items-center gap-1 pl-1">
                <span className="size-1.5 rounded-full bg-zinc-600" />
                <span className="size-1.5 rounded-full bg-zinc-600" />
                <span className="size-1.5 rounded-full bg-zinc-600" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-500">
              <span>Usage today: 2,340 / 100,000 tokens</span>
              <span className="font-medium text-zinc-400">
                enforced server-side
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}