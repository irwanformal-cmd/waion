import "server-only";
import type { AIMessage } from "@wai/shared";
import { chatRequestSchema } from "@wai/shared";
import { requireUser } from "@/lib/auth/session";
import { ApiError, toSafeResponse } from "@/lib/api/error";
import { isTrustedRequest } from "@/lib/security/origin";
import { checkRateLimit } from "@/lib/rate-limit/slidingWindow";
import { usedTokensToday } from "@/lib/usage/accounting";
import {
  createConversationFor,
  getOwnedConversation,
  getOwnedMessages,
} from "@/lib/queries/conversations";
import { getProvider, MAX_OUTPUT_TOKENS } from "@/lib/ai/provider";
import { firstMessageTitle, persistChat } from "@/lib/chat/service";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 120;

const HISTORY_LIMIT = 20;
const CHAT_WINDOW_SECONDS = 60;

function estimateInputTokens(messages: AIMessage[]): number {
  return messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
}

async function loadHistory(userId: string, conversationId: string, ownContent: string) {
  const history = await getOwnedMessages(userId, conversationId, HISTORY_LIMIT);
  if (!history) {
    throw new ApiError("NOT_FOUND", 404, "conversation does not exist or is not owned");
  }
  const messages: AIMessage[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: ownContent });
  return messages;
}

async function prepare(userId: string, req: Request) {
  if (!isTrustedRequest(req)) {
    throw new ApiError("FORBIDDEN", 403, "untrusted origin");
  }

  const limit = await checkRateLimit(`chat:user:${userId}`, env.CHAT_RATE_LIMIT_MAX, CHAT_WINDOW_SECONDS);
  if (!limit.ok) {
    throw new ApiError("RATE_LIMITED", 429, "chat rate limit exceeded");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("BAD_REQUEST", 400, "invalid JSON body");
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError("INVALID_INPUT", 400, parsed.error.message);
  }
  return parsed.data;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { conversationId, content } = await prepare(user.id, req);

    const usedTokens = await usedTokensToday(user.id);
    if (usedTokens >= env.FREE_DAILY_TOKEN_BUDGET) {
      throw new ApiError("QUOTA_EXCEEDED", 429, "daily token budget exhausted");
    }

    let conversation = conversationId
      ? await getOwnedConversation(user.id, conversationId)
      : null;
    if (conversationId && !conversation) {
      throw new ApiError("NOT_FOUND", 404, "conversation not found");
    }
    conversation ??= await createConversationFor(user.id, firstMessageTitle(content));

    const providerMessages = await loadHistory(user.id, conversation.id, content);
    const estimated = estimateInputTokens(providerMessages);
    if (estimated > env.MAX_REQUEST_TOKENS) {
      throw new ApiError("PAYLOAD_TOO_LARGE", 413, `estimated ${estimated} input tokens`);
    }

    const streaming = new URL(req.url).searchParams.get("stream") === "1";
    const provider = getProvider();

    if (streaming) {
      return handleStream(user.id, conversation.id, content, providerMessages, provider.name);
    }

    const { content: reply, usage } = await provider.generate({
      messages: providerMessages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    return Response.json(
      await persistChat({
        userId: user.id,
        conversationId: conversation.id,
        userContent: content,
        assistantContent: reply,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        model: provider.name,
        usedTokensToday: usedTokens,
        budgetTokens: env.FREE_DAILY_TOKEN_BUDGET,
      }),
      { status: 200 },
    );
  } catch (err) {
    return handleError(err);
  }
}

async function handleStream(
  userId: string,
  conversationId: string,
  userContent: string,
  providerMessages: AIMessage[],
  model: string,
): Promise<Response> {
  const usedTokens = await usedTokensToday(userId);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      try {
        let reply = "";
        let usage = { inputTokens: 0, outputTokens: 0 };
        try {
          const result = await getProvider().stream(
            { messages: providerMessages, maxOutputTokens: MAX_OUTPUT_TOKENS },
            (delta) => send({ type: "delta", text: delta }),
          );
          reply = result.content;
          usage = result.usage;
        } catch (err) {
          // Do not leak provider internals to the client.
          console.error("[chat] provider stream failed:", (err as Error).message);
          send({
            type: "error",
            code: "INTERNAL",
            message: "The AI provider failed to respond. Please try again.",
          });
          return;
        }

        const result = await persistChat({
          userId,
          conversationId,
          userContent,
          assistantContent: reply,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          model,
          usedTokensToday: usedTokens,
          budgetTokens: env.FREE_DAILY_TOKEN_BUDGET,
        });
        send({ type: "done", usage: result.usage });
      } catch (err) {
        send({
          type: "error",
          code: err instanceof ApiError ? err.code : "INTERNAL",
          message: "Failed to save the conversation. Please refresh and retry.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
      Connection: "keep-alive",
    },
  });
}

function handleError(err: unknown): Response {
  if (err instanceof ApiError && err.detail) {
    console.error("[chat] error:", err.code, err.detail);
  } else if (!(err instanceof ApiError)) {
    console.error("[chat] unexpected error:", (err as Error).message);
  }
  return toSafeResponse(err);
}
