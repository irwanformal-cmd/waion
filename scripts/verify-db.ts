import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    console.error("db:verify FAILED — DATABASE_URL is not set");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5_000 });
  try {
    const { rows } = await pool.query("SELECT 1 AS ok");
    console.log("db:verify OK —", JSON.stringify(rows[0]));
  } finally {
    await pool.end();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("db:verify FAILED —", err.message);
  process.exit(1);
});