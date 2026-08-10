import { messagesQuerySchema } from "@wai/shared";
import { requireUser } from "@/lib/auth/session";
import { ApiError, toSafeResponse } from "@/lib/api/error";
import { getOwnedMessages } from "@/lib/queries/conversations";
import { toMessageDto } from "@/lib/chat/service";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const parsed = messagesQuerySchema.safeParse({
      conversationId: url.searchParams.get("conversationId"),
    });
    if (!parsed.success) {
      throw new ApiError("INVALID_INPUT", 400, parsed.error.message);
    }
    const rows = await getOwnedMessages(user.id, parsed.data.conversationId);
    if (!rows) {
      throw new ApiError("NOT_FOUND", 404, "conversation not found");
    }
    return Response.json(rows.map(toMessageDto));
  } catch (err) {
    return toSafeResponse(err);
  }
}
