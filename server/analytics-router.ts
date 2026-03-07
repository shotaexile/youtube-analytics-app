import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import {
  videos,
  monthlyStats,
  channelConfig,
  csvUploads,
  adminSettings,
  pushTokens,
  type InsertVideo,
  type InsertMonthlyStats,
} from "../drizzle/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import * as crypto from "crypto";

// ── push notification helper ──────────────────────────────────────────────────
async function sendExpoPushNotifications(tokens: string[], title: string, body: string) {
  if (tokens.length === 0) return;
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: { type: "csv_update" },
  }));
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (e) {
    console.warn("Push notification send failed:", e);
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const engMatch = dateStr.match(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (engMatch) {
    const month = MONTH_MAP[engMatch[1]];
    const day = parseInt(engMatch[2]);
    const year = parseInt(engMatch[3]);
    if (month !== undefined && !isNaN(day) && !isNaN(year))
      return new Date(year, month, day);
  }
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch)
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVToVideos(csvContent: string): InsertVideo[] {
  const allLines = csvContent.split("\n");
  const lines = allLines.slice(1).filter((l) => !l.startsWith("合計"));
  const result: InsertVideo[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 11) continue;

    const rawId = cols[0]?.trim();
    const title = cols[1]?.trim();
    const publishedAt = cols[2]?.trim();
    const durationRaw = cols[3]?.trim();
    // Duration can be seconds (integer) or HH:MM:SS
    let duration = 0;
    if (durationRaw.includes(":")) {
      const parts = durationRaw.split(":");
      if (parts.length === 3) duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      else if (parts.length === 2) duration = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      duration = parseInt(durationRaw) || 0;
    }
    const likeRate = parseFloat(cols[4]) || 0;
    const avgViewRate = parseFloat(cols[5]) || 0;
    const views = parseInt(cols[6]) || 0;
    const subscriberChange = parseInt(cols[7]) || 0;
    const estimatedRevenue = parseFloat(cols[8]) || 0;
    const impressions = parseInt(cols[9]) || 0;
    const ctr = parseFloat(cols[10]) || 0;

    if (!rawId || !title) continue;
    if (rawId === "合計" || rawId.replace(/^\s+/, "").length !== 11) continue;

    const isShort = duration > 0 && duration <= 60;
    const isPrivate = rawId.startsWith(" ") || rawId.startsWith("-");
    const videoId = rawId.replace(/^\s+/, "");
    const publishedDate = parseDate(publishedAt);

    result.push({
      videoId,
      title,
      publishedAt,
      publishedDate: formatDateStr(publishedDate) as unknown as Date,
      duration,
      views,
      estimatedRevenue,
      impressions,
      ctr,
      avgViewRate,
      likeRate,
      subscriberChange,
      isShort,
      isPrivate,
    });
  }
  return result;
}

function buildMonthlyStats(videoRows: InsertVideo[]): InsertMonthlyStats[] {
  const map = new Map<string, { views: number; revenue: number; videoCount: number; subscriberChange: number }>();
  for (const v of videoRows) {
    const d = parseDate(v.publishedAt);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(month);
    if (existing) {
      existing.views += (v.views as number) || 0;
      existing.revenue += (v.estimatedRevenue as number) || 0;
      existing.videoCount += 1;
      existing.subscriberChange += (v.subscriberChange as number) || 0;
    } else {
      map.set(month, {
        views: (v.views as number) || 0,
        revenue: (v.estimatedRevenue as number) || 0,
        videoCount: 1,
        subscriberChange: (v.subscriberChange as number) || 0,
      });
    }
  }
  return Array.from(map.entries()).map(([month, stats]) => ({ month, ...stats }));
}

// ── thumbnail privacy check ─────────────────────────────────────────────────

/**
 * Check if a YouTube video is private/deleted by fetching its thumbnail.
 * Returns true if the video is private (thumbnail returns 404).
 */
async function checkIsPrivate(videoId: string): Promise<boolean> {
  try {
    const url = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    const res = await fetch(url, { method: "HEAD" });
    return res.status === 404;
  } catch {
    // Network error — assume public to avoid false positives
    return false;
  }
}

/**
 * Check all videos in parallel (batched to avoid overwhelming the network).
 * Returns a Set of videoIds that are private.
 */
async function checkPrivacyInBatches(videoIds: string[], batchSize = 20): Promise<Set<string>> {
  const privateIds = new Set<string>();
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (id) => ({ id, isPrivate: await checkIsPrivate(id) }))
    );
    for (const { id, isPrivate } of results) {
      if (isPrivate) privateIds.add(id);
    }
  }
  return privateIds;
}

// ── router ────────────────────────────────────────────────────────────────────

export const analyticsRouter = router({
  // Upload CSV and store to DB
  uploadCSV: publicProcedure
    .input(z.object({ csvContent: z.string(), uploadedBy: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const videoRows = parseCSVToVideos(input.csvContent);
      if (videoRows.length === 0) throw new Error("No valid video data found in CSV");

      // Check thumbnail availability to accurately detect private/deleted videos
      const allVideoIds = videoRows.map((v) => v.videoId as string);
      const privateIds = await checkPrivacyInBatches(allVideoIds, 20);
      // Apply accurate privacy flag (override CSV-based heuristic)
      for (const v of videoRows) {
        v.isPrivate = privateIds.has(v.videoId as string);
        // Shorts cannot be private (private videos have no duration info)
        if (v.isPrivate) v.isShort = false;
      }

      // Upsert videos one by one (MySQL onDuplicateKeyUpdate)
      for (const v of videoRows) {
        await db
          .insert(videos)
          .values(v)
          .onDuplicateKeyUpdate({
            set: {
              title: v.title,
              publishedAt: v.publishedAt,
              publishedDate: v.publishedDate,
              duration: v.duration,
              views: v.views,
              estimatedRevenue: v.estimatedRevenue,
              impressions: v.impressions,
              ctr: v.ctr,
              avgViewRate: v.avgViewRate,
              likeRate: v.likeRate,
              subscriberChange: v.subscriberChange,
              isShort: v.isShort,
              isPrivate: v.isPrivate,
            },
          });
      }

      // Rebuild monthly stats
      const statsRows = buildMonthlyStats(videoRows);
      for (const s of statsRows) {
        await db
          .insert(monthlyStats)
          .values(s)
          .onDuplicateKeyUpdate({
            set: {
              views: s.views,
              revenue: s.revenue,
              videoCount: s.videoCount,
              subscriberChange: s.subscriberChange,
            },
          });
      }

      // Record upload history
      await db.insert(csvUploads).values({
        uploadedBy: input.uploadedBy ?? null,
        videoCount: videoRows.length,
      });

      // Send push notifications to all registered devices
      const tokenRows = await db.select().from(pushTokens);
      const tokens = tokenRows.map((r) => r.token).filter(Boolean);
      if (tokens.length > 0) {
        const uploader = input.uploadedBy || "チームメンバー";
        await sendExpoPushNotifications(
          tokens,
          "📊 ViewCore データ更新",
          `${uploader}がCSVをアップロードしました（${videoRows.length}本）。最新データを確認してください。`
        );
      }

      return { success: true, videoCount: videoRows.length };
    }),

  // Get all videos
  getVideos: publicProcedure
    .input(
      z.object({
        filter: z.enum(["all", "regular", "short", "private"]).optional(),
        sortBy: z.enum(["views", "estimatedRevenue", "publishedDate", "ctr", "likeRate", "avgViewRate", "subscriberChange", "impressions"]).optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const { filter = "all", sortBy = "publishedDate", sortOrder = "desc", limit = 600, offset = 0 } = input || {};

      let baseQuery = db.select().from(videos).$dynamic();

      if (filter === "regular") {
        baseQuery = baseQuery.where(and(eq(videos.isShort, false), eq(videos.isPrivate, false)));
      } else if (filter === "short") {
        baseQuery = baseQuery.where(eq(videos.isShort, true));
      } else if (filter === "private") {
        baseQuery = baseQuery.where(eq(videos.isPrivate, true));
      }

      type VideoCol = typeof videos.views | typeof videos.estimatedRevenue | typeof videos.publishedDate | typeof videos.ctr | typeof videos.likeRate | typeof videos.avgViewRate | typeof videos.subscriberChange | typeof videos.impressions;
      const colMap: Record<string, VideoCol> = {
        views: videos.views,
        estimatedRevenue: videos.estimatedRevenue,
        publishedDate: videos.publishedDate,
        ctr: videos.ctr,
        likeRate: videos.likeRate,
        avgViewRate: videos.avgViewRate,
        subscriberChange: videos.subscriberChange,
        impressions: videos.impressions,
      };
      const col = colMap[sortBy] || videos.publishedDate;
      baseQuery = baseQuery.orderBy(sortOrder === "asc" ? asc(col) : desc(col));

      return baseQuery.limit(limit).offset(offset);
    }),

  // Get monthly stats
  getMonthlyStats: publicProcedure
    .input(z.object({ months: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { months = 24 } = input || {};
      const rows = await db
        .select()
        .from(monthlyStats)
        .orderBy(desc(monthlyStats.month))
        .limit(months);
      return rows.reverse();
    }),

  // Get channel summary (aggregated)
  getChannelSummary: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const allVideos = await db.select().from(videos);
    if (allVideos.length === 0) return null;

    const regularVideos = allVideos.filter((v) => !v.isShort && !v.isPrivate);
    const shortVideos = allVideos.filter((v) => v.isShort);
    const privateVideos = allVideos.filter((v) => v.isPrivate);
    const validRevenue = allVideos.filter((v) => v.estimatedRevenue > 0);

    return {
      totalViews: allVideos.reduce((s: number, v) => s + v.views, 0),
      totalRevenue: validRevenue.reduce((s: number, v) => s + v.estimatedRevenue, 0),
      totalImpressions: allVideos.reduce((s: number, v) => s + v.impressions, 0),
      avgCtr: allVideos.length > 0 ? allVideos.reduce((s: number, v) => s + v.ctr, 0) / allVideos.length : 0,
      avgLikeRate: allVideos.length > 0 ? allVideos.reduce((s: number, v) => s + v.likeRate, 0) / allVideos.length : 0,
      avgViewRate: allVideos.length > 0 ? allVideos.reduce((s: number, v) => s + v.avgViewRate, 0) / allVideos.length : 0,
      totalSubscriberChange: allVideos.reduce((s: number, v) => s + v.subscriberChange, 0),
      videoCount: allVideos.length,
      shortCount: shortVideos.length,
      regularCount: regularVideos.length,
      privateCount: privateVideos.length,
    };
  }),

  // Get channel config
  getChannelConfig: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(channelConfig).limit(1);
    return rows[0] || null;
  }),

  // Save channel config
  saveChannelConfig: publicProcedure
    .input(
      z.object({
        channelName: z.string(),
        channelUrl: z.string().optional(),
        channelId: z.string().optional(),
        iconUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(channelConfig).limit(1);
      if (existing.length > 0) {
        await db.update(channelConfig).set({
          channelName: input.channelName,
          channelUrl: input.channelUrl || "",
          channelId: input.channelId || "",
          iconUrl: input.iconUrl || null,
        });
      } else {
        await db.insert(channelConfig).values({
          channelName: input.channelName,
          channelUrl: input.channelUrl || "",
          channelId: input.channelId || "",
          iconUrl: input.iconUrl || null,
        });
      }
      return { success: true };
    }),

  // ── Admin password management ────────────────────────────────────────────

  // Check if admin password is set
  hasAdminPassword: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return false;
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, "admin_password_hash"));
    return rows.length > 0 && !!rows[0].settingValue;
  }),

  // Set admin password (first time or reset)
  setAdminPassword: publicProcedure
    .input(z.object({ password: z.string().min(4) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const hash = crypto.createHash("sha256").update(input.password).digest("hex");
      const existing = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, "admin_password_hash"));
      if (existing.length > 0) {
        await db.update(adminSettings).set({ settingValue: hash }).where(eq(adminSettings.settingKey, "admin_password_hash"));
      } else {
        await db.insert(adminSettings).values({ settingKey: "admin_password_hash", settingValue: hash });
      }
      return { success: true };
    }),

  // Verify admin password
  verifyAdminPassword: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, "admin_password_hash"));
      if (rows.length === 0 || !rows[0].settingValue) {
        // No password set — allow access
        return { valid: true };
      }
      const hash = crypto.createHash("sha256").update(input.password).digest("hex");
      return { valid: hash === rows[0].settingValue };
    }),

  // ── Push token management ─────────────────────────────────────────────────

  // Register push token
  registerPushToken: publicProcedure
    .input(z.object({ token: z.string(), deviceName: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .insert(pushTokens)
        .values({ token: input.token, deviceName: input.deviceName || null })
        .onDuplicateKeyUpdate({ set: { deviceName: input.deviceName || null } });
      return { success: true };
    }),

  // Check if DB has data
  hasData: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return false;
    const rows = await db.select().from(videos).limit(1);
    return rows.length > 0;
  }),

  // Get last upload info
  getLastUpload: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(csvUploads)
      .orderBy(desc(csvUploads.createdAt))
      .limit(1);
    return rows[0] || null;
  }),

  // ── AI Bot ────────────────────────────────────────────────────────────────
  // Answer questions about the channel analytics using LLM
  askBot: publicProcedure
    .input(z.object({ question: z.string().max(500) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch all videos
      const allVideos = await db.select().from(videos).orderBy(desc(videos.publishedDate));
      if (allVideos.length === 0) throw new Error("データがありません。CSVをアップロードしてください。");

      // Fetch monthly stats
      const allMonthly = await db.select().from(monthlyStats).orderBy(asc(monthlyStats.month));

      // Fetch channel config
      const channelRows = await db.select().from(channelConfig).limit(1);
      const channel = channelRows[0];

      // Build a compact data summary for the LLM
      const totalVideos = allVideos.length;
      const publicVideos = allVideos.filter((v) => !v.isPrivate);
      const shortVideos = publicVideos.filter((v) => v.isShort);
      const regularVideos = publicVideos.filter((v) => !v.isShort);
      const totalViews = publicVideos.reduce((s, v) => s + v.views, 0);
      const totalRevenue = publicVideos.reduce((s, v) => s + v.estimatedRevenue, 0);
      const totalSubscriberChange = publicVideos.reduce((s, v) => s + v.subscriberChange, 0);
      const avgCtr = publicVideos.length > 0 ? publicVideos.reduce((s, v) => s + v.ctr, 0) / publicVideos.length : 0;
      const avgViewRate = publicVideos.length > 0 ? publicVideos.reduce((s, v) => s + v.avgViewRate, 0) / publicVideos.length : 0;

      // Top 10 videos by views
      const top10 = [...publicVideos]
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map((v) => `  - 「${v.title}」 再生:${v.views.toLocaleString()} CTR:${(v.ctr * 100).toFixed(1)}% 視聴維持率:${(v.avgViewRate * 100).toFixed(1)}% 登録者増減:${v.subscriberChange > 0 ? '+' : ''}${v.subscriberChange} ${v.isShort ? '[ショート]' : '[通常]'} 投稿:${v.publishedAt}`);

      // Monthly stats summary
      const monthlySummary = allMonthly.map((m) =>
        `  ${m.month}: 再生${m.views.toLocaleString()} 収益¥${Math.round(m.revenue).toLocaleString()} 投稿${m.videoCount}本 登録者${m.subscriberChange > 0 ? '+' : ''}${m.subscriberChange}`
      );

      // Recent 5 videos
      const recent5 = allVideos.slice(0, 5).map((v) =>
        `  - 「${v.title}」 再生:${v.views.toLocaleString()} 投稿:${v.publishedAt} ${v.isShort ? '[ショート]' : '[通常]'}`
      );

      const systemPrompt = `あなたは「${channel?.channelName || 'ViewCore'}」というYouTubeチャンネルの専属アナリストです。
以下のチャンネルデータを元に、チームメンバーの質問に日本語で具体的・簡潔に回答してください。
数値は必ず実際のデータを使用し、推測や一般論は避けてください。
回答は3〜5文程度でまとめ、重要な数値を太字（**数値**）で強調してください。

【チャンネル概要】
- チャンネル名: ${channel?.channelName || '不明'}
- 総動画数: ${totalVideos}本（公開: ${publicVideos.length}本、ショート: ${shortVideos.length}本、通常: ${regularVideos.length}本）
- 総再生数: ${totalViews.toLocaleString()}
- 総収益: ¥${Math.round(totalRevenue).toLocaleString()}
- 総登録者増減: ${totalSubscriberChange > 0 ? '+' : ''}${totalSubscriberChange.toLocaleString()}
- 平均CTR: ${(avgCtr * 100).toFixed(2)}%
- 平均視聴維持率: ${(avgViewRate * 100).toFixed(1)}%

【月別データ】
${monthlySummary.join('\n')}

【再生数トップ10動画】
${top10.join('\n')}

【最新5本の動画】
${recent5.join('\n')}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.question },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const answer = typeof rawContent === 'string' ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text ?? '').join('') : '回答を生成できませんでした。');
      return { answer };
    }),
});
