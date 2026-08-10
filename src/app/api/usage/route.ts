import { requireUser } from "@/lib/auth/session";
import { toSafeResponse } from "@/lib/api/error";
import { usageToday } from "@/lib/usage/accounting";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const user = await requireUser();
    const { usedTokens, requestsToday } = await usageToday(user.id);
    return Response.json({
      usedTokens,
      budgetTokens: env.FREE_DAILY_TOKEN_BUDGET,
      requestsToday,
    });
  } catch (err) {
    return toSafeResponse(err);
  }
}
