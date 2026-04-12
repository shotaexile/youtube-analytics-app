import "./load-env.js";
import { drizzle } from "drizzle-orm/mysql2";
import { aiDailyReport } from "../drizzle/schema";
import { desc } from "drizzle-orm";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  const rows = await db.select({
    id: aiDailyReport.id,
    reportDate: aiDailyReport.reportDate,
    generatedAt: aiDailyReport.generatedAt,
    toolRankingsLength: aiDailyReport.toolRankings,
  }).from(aiDailyReport).orderBy(desc(aiDailyReport.reportDate)).limit(5);
  
  console.log(`Total rows found: ${rows.length}`);
  for (const row of rows) {
    const rankings = row.toolRankingsLength ? JSON.parse(row.toolRankingsLength as string) : [];
    console.log(`  id=${row.id}, date=${row.reportDate}, generatedAt=${row.generatedAt}, rankings=${rankings.length}`);
    for (const r of rankings) {
      console.log(`    - ${r.category}`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
