/**
 * Framework-agnostic WAIon API client. Safe for web, desktop, and mobile:
 * no Node APIs, no cookies handling, no secrets. Web uses same-origin fetch
 * (cookies flow automatically); desktop/mobile pass baseUrl + optional token.
 */
import { WaiApiError, isApiErrorBody } from "./errors";
import type {
  ChatResultDto,
  ChatStreamEvent,
  ConversationDetailDto,
  ConversationDto,
  MessageDto,
  UsageSummaryDto,
} from "./types";
import type { ChatRequest, CreateConversationRequest } from "./schemas";

export interface WaiClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  /** Bearer token provider (mobile/desktop). For web, leave undefined (cookies). */
  getToken?: () => string | undefined | Promise<string | undefined>;
}

export class WaiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getToken?: WaiClientOptions["getToken"];

  constructor(options: WaiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.fetchFn = options.fetchFn ?? fetch;
    this.getToken = options.getToken;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken?.();
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 204) return undefined as T;

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // Non-JSON body.
    }

    if (!res.ok) {
      if (isApiErrorBody(body)) {
        throw new WaiApiError(body.error.code, res.status);
      }
      throw new WaiApiError("INTERNAL", res.status);
    }
    return body as T;
  }

  // --- Conversations -------------------------------------------------------

  listConversations(): Promise<ConversationDto[]> {
    return this.request<ConversationDto[]>("/api/conversations");
  }

  getConversation(id: string): Promise<ConversationDetailDto> {
    return this.request<ConversationDetailDto>(`/api/conversations/${id}`);
  }

  createConversation(input?: CreateConversationRequest): Promise<ConversationDto> {
    return this.request<ConversationDto>("/api/conversations", {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    });
  }

  deleteConversation(id: string): Promise<void> {
    return this.request<void>(`/api/conversations/${id}`, { method: "DELETE" });
  }

  // --- Messages ------------------------------------------------------------

  listMessages(conversationId: string): Promise<MessageDto[]> {
    return this.request<MessageDto[]>(
      `/api/messages?conversationId=${encodeURIComponent(conversationId)}`,
    );
  }

  // --- Chat ----------------------------------------------------------------

  chat(input: ChatRequest): Promise<ChatResultDto> {
    return this.request<ChatResultDto>("/api/chat", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** Non-streaming alias kept for tests and non-web clients. */
  async chatStream(input: ChatRequest, onEvent: (event: ChatStreamEvent) => void | Promise<void>): Promise<void> {
    const token = await this.getToken?.();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await this.fetchFn(`${this.baseUrl}/api/chat?stream=1`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (isApiErrorBody(body)) throw new WaiApiError(body.error.code, res.status);
      throw new WaiApiError("INTERNAL", res.status);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new WaiApiError("INTERNAL", 500);

    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const line = rawEvent
          .split("\n")
          .find((l) => l.startsWith("data:"))
          ?.slice(5)
          .trim();
        if (line && line !== "[DONE]") {
          const event = JSON.parse(line) as ChatStreamEvent;
          await onEvent(event);
          if (event.type === "error") throw new WaiApiError(event.code as never, 400);
        }
      }
    }
  }

  // --- Usage ---------------------------------------------------------------

  usage(): Promise<UsageSummaryDto> {
    return this.request<UsageSummaryDto>("/api/usage");
  }
}
