import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

/**
 * Sliding-window rate limiter backed by Postgres (rate_limit_counters).
 * Atomic upsert, survives restarts, works across instances.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rows = await db.execute(sql`
    INSERT INTO rate_limit_counters (key, window_start, count)
    VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_counters.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN 1
        ELSE rate_limit_counters.count + 1
      END,
      window_start = CASE
        WHEN rate_limit_counters.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN now()
        ELSE rate_limit_counters.window_start
      END
    RETURNING count
  `);
  const count = Number(rows.rows[0]?.count ?? 0);
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}
