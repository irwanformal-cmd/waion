import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { DEFAULT_CONVERSATION_TITLE, MAX_TITLE_LENGTH } from "@wai/shared";

/**
 * All conversation access is scoped by `userId` in SQL. A missing or foreign
 * row yields null, which callers translate to 404 (no existence oracle).
 */
export async function getOwnedConversation(
  userId: string,
  conversationId: string,
) {
  const rows = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, conversationId), eq(conversations.userId, userId)),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listOwnedConversations(userId: string, limit = 100) {
  return db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: sql<number>`COALESCE((
        SELECT COUNT(*) FROM ${messages} m
        WHERE m.conversation_id = ${conversations.id}
      ), 0)::int`,
    })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
}

export async function createConversationFor(
  userId: string,
  title: string = DEFAULT_CONVERSATION_TITLE,
) {
  const safeTitle = title.trim().slice(0, MAX_TITLE_LENGTH) || DEFAULT_CONVERSATION_TITLE;
  const rows = await db
    .insert(conversations)
    .values({ userId, title: safeTitle })
    .returning();
  return rows[0]!;
}

/** Messages of a conversation after verifying ownership. */
export async function getOwnedMessages(
  userId: string,
  conversationId: string,
  limit = 500,
) {
  const owned = await getOwnedConversation(userId, conversationId);
  if (!owned) return null;
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

/** Deletes only if owned; returns whether anything was deleted. */
export async function deleteOwnedConversation(
  userId: string,
  conversationId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(conversations)
    .where(
      and(eq(conversations.id, conversationId), eq(conversations.userId, userId)),
    )
    .returning({ id: conversations.id });
  return deleted.length > 0;
}

export async function countOwnedConversations(userId: string): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(conversations)
    .where(eq(conversations.userId, userId));
  return rows[0]?.value ?? 0;
}
