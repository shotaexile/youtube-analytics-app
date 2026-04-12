/**
 * Fix ai_daily_report table:
 * 1. Delete duplicate rows (keep only the latest per reportDate)
 * 2. Then migration can add UNIQUE constraint
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  
  try {
    // Show current state
    const [rows] = await conn.execute("SELECT id, reportDate, generatedAt FROM ai_daily_report ORDER BY reportDate, id");
    console.log("Current rows:", rows);

    // Delete duplicates: keep only the row with max id per reportDate
    await conn.execute(`
      DELETE FROM ai_daily_report
      WHERE id NOT IN (
        SELECT max_id FROM (
          SELECT MAX(id) as max_id FROM ai_daily_report GROUP BY reportDate
        ) t
      )
    `);
    
    const [after] = await conn.execute("SELECT id, reportDate, generatedAt FROM ai_daily_report ORDER BY reportDate");
    console.log("After dedup:", after);
    
    console.log("Done! Now run pnpm db:push to apply the UNIQUE constraint.");
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
