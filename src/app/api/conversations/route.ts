import { createConversationSchema } from "@wai/shared";
import { requireUser } from "@/lib/auth/session";
import { ApiError, toSafeResponse } from "@/lib/api/error";
import { isTrustedRequest } from "@/lib/security/origin";
import {
  countOwnedConversations,
  createConversationFor,
  listOwnedConversations,
} from "@/lib/queries/conversations";
import { toConversationDto } from "@/lib/chat/service";

const MAX_CONVERSATIONS = 500;

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await listOwnedConversations(user.id);
    return Response.json(rows.map(toConversationDto));
  } catch (err) {
    return toSafeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!isTrustedRequest(req)) {
      throw new ApiError("FORBIDDEN", 403, "untrusted origin");
    }
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError("BAD_REQUEST", 400, "invalid JSON body");
    }
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("INVALID_INPUT", 400, parsed.error.message);
    }

    const owned = await countOwnedConversations(user.id);
    if (owned >= MAX_CONVERSATIONS) {
      throw new ApiError("QUOTA_EXCEEDED", 429, "conversation limit reached");
    }

    const row = await createConversationFor(user.id, parsed.data.title);
    return Response.json(toConversationDto(row), { status: 201 });
  } catch (err) {
    return toSafeResponse(err);
  }
}
