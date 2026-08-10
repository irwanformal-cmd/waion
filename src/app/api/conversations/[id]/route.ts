import { uuidSchema } from "@wai/shared";
import { requireUser } from "@/lib/auth/session";
import { ApiError, toSafeResponse } from "@/lib/api/error";
import { isTrustedRequest } from "@/lib/security/origin";
import {
  deleteOwnedConversation,
  getOwnedConversation,
  getOwnedMessages,
} from "@/lib/queries/conversations";
import { toConversationDto, toMessageDto } from "@/lib/chat/service";

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    throw new ApiError("INVALID_INPUT", 400, "invalid conversation id");
  }
  return parsed.data;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = await resolveId(params);
    const conversation = await getOwnedConversation(user.id, id);
    if (!conversation) {
      throw new ApiError("NOT_FOUND", 404, "conversation not found");
    }
    const rows = await getOwnedMessages(user.id, id);
    return Response.json({
      conversation: toConversationDto(conversation),
      messages: (rows ?? []).map(toMessageDto),
    });
  } catch (err) {
    return toSafeResponse(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    if (!isTrustedRequest(req)) {
      throw new ApiError("FORBIDDEN", 403, "untrusted origin");
    }
    const id = await resolveId(params);
    const deleted = await deleteOwnedConversation(user.id, id);
    if (!deleted) {
      throw new ApiError("NOT_FOUND", 404, "conversation not found");
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    return toSafeResponse(err);
  }
}
