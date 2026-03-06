import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  videos,
  monthlyStats,
  channelConfig,
  csvUploads,
  type InsertVideo,
  type InsertMonthlyStats,
} from "../drizzle/schema";
import { eq, desc, asc, and } from "drizzle-orm";

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
});
