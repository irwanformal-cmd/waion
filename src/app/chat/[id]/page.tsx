import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOwnedConversation, getOwnedMessages } from "@/lib/queries/conversations";
import { toMessageDto } from "@/lib/chat/service";
import { ChatClient } from "@/components/chat/ChatClient";
import { AppHeader } from "@/components/app/AppHeader";
import type { MessageDto } from "@wai/shared";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const conversation = await getOwnedConversation(session.user.id, id);
  if (!conversation) notFound();

  const rows = await getOwnedMessages(session.user.id, id);
  const messages: MessageDto[] = (rows ?? []).map(toMessageDto);

  return (
    <>
      <AppHeader />
      <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-4 pt-6 sm:px-6">
        <ChatClient
          conversationId={conversation.id}
          initialTitle={conversation.title}
          initialMessages={messages}
        />
      </div>
    </>
  );
}
