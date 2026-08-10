import type { AIProviderName, PlanName, UserRole } from "./constants";

export type MessageRole = "user" | "assistant";

export interface ConversationDto {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokensIn: number;
  tokensOut: number;
  createdAt: string;
}

export interface UsageSummaryDto {
  usedTokens: number;
  budgetTokens: number;
  requestsToday: number;
}

export interface ChatUsageDto {
  inputTokens: number;
  outputTokens: number;
  usedTokensToday: number;
  budgetTokens: number;
}

export interface ChatResultDto {
  userMessage: MessageDto;
  assistantMessage: MessageDto;
  usage: ChatUsageDto;
}

export interface ConversationDetailDto {
  conversation: ConversationDto;
  messages: MessageDto[];
}

/** Server-rendered session shape (subset safe for clients). */
export interface SessionUserDto {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: UserRole;
  plan: PlanName;
  image?: string | null;
}

/** Events emitted by the SSE chat stream endpoint. */
export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; usage: ChatUsageDto }
  | { type: "error"; code: string; message: string };

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
}

/** Messages as sent to an AI provider (server-side only; shape shared for typing). */
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export const AI_PROVIDER_NAMES: AIProviderName[] = [
  "openai",
  "openai-compatible",
  "anthropic",
];
