import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, userToDto } from "@/lib/auth/session";
import { listOwnedConversations } from "@/lib/queries/conversations";
import { usageToday } from "@/lib/usage/accounting";
import { env } from "@/lib/env";
import { toConversationDto } from "@/lib/chat/service";
import { NewChatButton } from "@/components/dashboard/NewChatButton";
import { DeleteConversationButton } from "@/components/dashboard/DeleteConversationButton";
import { VerificationStatus } from "@/components/dashboard/VerificationStatus";
import { AppHeader } from "@/components/app/AppHeader";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = userToDto(session.user);

  const [rows, usage] = await Promise.all([
    listOwnedConversations(user.id),
    usageToday(user.id),
  ]);
  const conversations = rows.map(toConversationDto);
  const pct = Math.min(
    100,
    Math.round((usage.usedTokens / env.FREE_DAILY_TOKEN_BUDGET) * 100),
  );

  return (
    <>
      <AppHeader user={user} />
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Hello, {user.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
            {!user.emailVerified ? <VerificationStatus /> : null}
          </div>
          <NewChatButton />
        </div>

        <div className="mt-8 rounded-lg border border-zinc-800 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Token usage today</span>
          <span className="font-medium text-zinc-200">
            {usage.usedTokens.toLocaleString()} /{" "}
            {env.FREE_DAILY_TOKEN_BUDGET.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.max(pct, 1)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          {usage.requestsToday} request{usage.requestsToday === 1 ? "" : "s"} today. Limits are enforced server-side.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Conversations
        </h2>
        {conversations.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-800 p-10 text-center">
            <p className="text-sm text-zinc-500">No conversations yet.</p>
            <p className="mt-1 text-sm text-zinc-600">
              Start a new chat and your history will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <div className="group flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60">
                  <Link
                    href={`/chat/${c.id}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {c.messageCount} message{c.messageCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-600">
                      {formatDate(c.updatedAt)}
                    </span>
                  </Link>
                  <DeleteConversationButton
                    conversationId={c.id}
                    title={c.title}
                    className="shrink-0"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </>
  );
}
