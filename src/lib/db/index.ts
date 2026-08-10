import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000,
});

export const db = drizzle(pool, { schema });

type TransactionFn<T> = Parameters<typeof db.transaction<T>>[0];

export function withTransaction<T>(fn: TransactionFn<T>): Promise<T> {
  return db.transaction(fn);
}