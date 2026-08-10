import { z } from "zod";
import {
  DEFAULT_CONVERSATION_TITLE,
  MAX_MESSAGE_LENGTH,
  MAX_TITLE_LENGTH,
} from "./constants";

export const uuidSchema = z.string().uuid("invalid id");

export const conversationIdSchema = uuidSchema;

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, "message is empty")
  .max(MAX_MESSAGE_LENGTH, `message exceeds ${MAX_MESSAGE_LENGTH} characters`);

export const chatRequestSchema = z.object({
  conversationId: conversationIdSchema.optional(),
  content: messageContentSchema,
});

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH).optional(),
});

export const messagesQuerySchema = z.object({
  conversationId: conversationIdSchema,
});

export const conversationTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_TITLE_LENGTH);

export const defaultTitleSchema = z.literal(DEFAULT_CONVERSATION_TITLE);

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateConversationRequest = z.infer<typeof createConversationSchema>;
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;
