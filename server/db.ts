import { DrizzleError, eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, aiDailyReport, InsertAiDailyReport, infoSources, InsertInfoSource } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

/** Get the latest AI daily report */
export async function getLatestAiDailyReport() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(aiDailyReport).orderBy(desc(aiDailyReport.reportDate)).limit(1);
  return rows[0] ?? null;
}

// ─── Info Sources ────────────────────────────────────────────────────────────

/** Get all info sources ordered by category and sortOrder */
export async function getInfoSources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(infoSources).orderBy(asc(infoSources.category), asc(infoSources.sortOrder), asc(infoSources.id));
}

/** Add a new info source */
export async function addInfoSource(data: Pick<InsertInfoSource, "category" | "title" | "url" | "memo">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(infoSources).values({
    category: data.category,
    title: data.title,
    url: data.url,
    memo: data.memo ?? null,
    sortOrder: 999,
  });
  return result;
}

/** Update memo for an info source */
export async function updateInfoSourceMemo(id: number, memo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(infoSources).set({ memo }).where(eq(infoSources.id, id));
}

/** Delete an info source */
export async function deleteInfoSource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(infoSources).where(eq(infoSources.id, id));
}

/** Seed default info sources if the table is empty */
export async function seedDefaultInfoSources() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ id: infoSources.id }).from(infoSources).limit(1);
  if (existing.length > 0) return; // already seeded

  const defaults: InsertInfoSource[] = [
    // YouTube
    { category: "youtube", title: "KEITO【AI&WEB ch】", url: "https://www.youtube.com/@keitoaiweb", sortOrder: 1 },
    { category: "youtube", title: "動画編集の中の人", url: "https://www.youtube.com/@%E5%8B%95%E7%94%BB%E7%B7%A8%E9%9B%86%E3%81%AE%E4%B8%AD%E3%81%AE%E4%BA%BA", sortOrder: 2 },
    { category: "youtube", title: "AI様の下僕", url: "https://www.youtube.com/@AI-geboku", sortOrder: 3 },
    { category: "youtube", title: "AI大学【AI&ChatGPT最新情報】", url: "https://www.youtube.com/@AIAIChatGPT-cj4sh/videos", sortOrder: 4 },
    { category: "youtube", title: "チャエン【AI研究所】～仕事で使える最新のAI情報を発信～ Byデジライズ", url: "https://www.youtube.com/@chaen-ai-lab", sortOrder: 5 },
    { category: "youtube", title: "いけともch", url: "https://www.youtube.com/@iketomo-ch/videos", sortOrder: 6 },
    // X
    { category: "x", title: "Ledge.ai | AIトレンドの鉱脆", url: "https://x.com/ledgeai?s=20", sortOrder: 1 },
    { category: "x", title: "AI様の下僕", url: "https://x.com/aigeboku?s=20", sortOrder: 2 },
    // Website
    { category: "website", title: "There's An AI For That (TAAFT)", url: "https://theresanaiforthat.com/", sortOrder: 1 },
    { category: "website", title: "Artificial Analysis", url: "https://artificialanalysis.ai/#media-leaderboards", sortOrder: 2 },
    { category: "website", title: "AIsmiley", url: "https://aismiley.co.jp/", sortOrder: 3 },
    { category: "website", title: "Ladge.ai", url: "https://ledge.ai/", sortOrder: 4 },
  ];

  await db.insert(infoSources).values(defaults);
}

/** Upsert AI daily report for a given date */
export async function upsertAiDailyReport(data: InsertAiDailyReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use the date string (YYYY-MM-DD) to avoid timezone issues with MySQL date type
  // reportDate is stored as a DATE column, so we need to match it as a string
  const dateStr = data.reportDate instanceof Date
    ? data.reportDate.toISOString().split("T")[0]
    : String(data.reportDate);

  // Try to find existing record for this date
  const existing = await db.select({ id: aiDailyReport.id })
    .from(aiDailyReport)
    .where(eq(aiDailyReport.reportDate, dateStr as unknown as Date))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    await db.update(aiDailyReport)
      .set({
        latestNews: data.latestNews,
        toolRankings: data.toolRankings,
        videoAiTools: data.videoAiTools,
        generatedAt: new Date(),
      })
      .where(eq(aiDailyReport.id, existing[0].id));
  } else {
    // Insert new record
    await db.insert(aiDailyReport).values(data);
  }
}
