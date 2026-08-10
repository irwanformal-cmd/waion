import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export interface UsageToday {
  usedTokens: number;
  requestsToday: number;
}

/** Total tokens consumed by a user in the last 24h (quota source of truth). */
export async function usedTokensToday(userId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT COALESCE(SUM(tokens_in + tokens_out), 0)::int AS used
    FROM usage_events
    WHERE user_id = ${userId}
      AND created_at >= now() - interval '1 day'
  `);
  return Number(rows.rows[0]?.used ?? 0);
}

export async function usageToday(userId: string): Promise<UsageToday> {
  const rows = await db.execute(sql`
    SELECT
      COALESCE(SUM(tokens_in + tokens_out), 0)::int AS used,
      COUNT(*)::int AS requests
    FROM usage_events
    WHERE user_id = ${userId}
      AND created_at >= now() - interval '1 day'
  `);
  const row = rows.rows[0] as { used?: number; requests?: number } | undefined;
  return {
    usedTokens: Number(row?.used ?? 0),
    requestsToday: Number(row?.requests ?? 0),
  };
}
