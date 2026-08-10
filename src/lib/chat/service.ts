import "server-only";
import { eq } from "drizzle-orm";
import { withTransaction } from "@/lib/db";
import { conversations, messages, usageEvents } from "@/lib/db/schema";
import type {
  ChatResultDto,
  ConversationDto,
  MessageDto,
  MessageRole,
} from "@wai/shared";

function toMessageDto(row: typeof messages.$inferSelect): MessageDto {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role as MessageRole,
    content: row.content,
    tokensIn: row.tokensIn,
    tokensOut: row.tokensOut,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toConversationDto(row: {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}): ConversationDto {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messageCount: row.messageCount ?? 0,
  };
}

export function firstMessageTitle(content: string): string {
  const singleLine = content.replace(/\s+/g, " ").trim();
  return singleLine.length > 60 ? `${singleLine.slice(0, 60)}...` : singleLine;
}

/**
 * Persists one user message + one assistant message + one usage event in a
 * single transaction, and refreshes the conversation timestamp.
 */
export async function persistChat({
  userId,
  conversationId,
  userContent,
  assistantContent,
  inputTokens,
  outputTokens,
  model,
  usedTokensToday,
  budgetTokens,
}: {
  userId: string;
  conversationId: string;
  userContent: string;
  assistantContent: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  usedTokensToday: number;
  budgetTokens: number;
}): Promise<ChatResultDto> {
  const result = await withTransaction(async (tx) => {
    const [userMessage] = await tx
      .insert(messages)
      .values({
        conversationId,
        role: "user",
        content: userContent,
        tokensIn: inputTokens,
        tokensOut: 0,
      })
      .returning();

    const [assistantMessage] = await tx
      .insert(messages)
      .values({
        conversationId,
        role: "assistant",
        content: assistantContent,
        tokensIn: 0,
        tokensOut: outputTokens,
      })
      .returning();

    await tx.insert(usageEvents).values({
      userId,
      conversationId,
      model,
      tokensIn: inputTokens,
      tokensOut: outputTokens,
    });

    await tx
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return { userMessage, assistantMessage };
  });

  return {
    userMessage: toMessageDto(result.userMessage!),
    assistantMessage: toMessageDto(result.assistantMessage!),
    usage: {
      inputTokens,
      outputTokens,
      usedTokensToday: usedTokensToday + inputTokens + outputTokens,
      budgetTokens,
    },
  };
}

export { toMessageDto };
