/**
 * useAnalytics - DB-backed data hooks for ViewCore
 *
 * These hooks fetch data from the server DB via tRPC.
 * They fall back to local CSV data when the DB has no data yet.
 */
import { trpc } from "@/lib/trpc";
import { parseVideoData, getChannelSummary, getMonthlyStats as getLocalMonthlyStats } from "./csv-parser";
import type { VideoData, ChannelSummary, MonthlyStats } from "./types";

// Convert DB video row to VideoData shape
function dbRowToVideoData(row: {
  videoId: string;
  title: string;
  publishedAt: string;
  publishedDate: string | Date;
  duration: number;
  views: number;
  estimatedRevenue: number;
  impressions: number;
  ctr: number;
  avgViewRate: number;
  likeRate: number;
  subscriberChange: number;
  isShort: boolean;
  isPrivate: boolean;
}): VideoData {
  const dateStr = typeof row.publishedDate === "string" ? row.publishedDate : row.publishedDate?.toString?.() ?? "";
  let publishedDate: Date;
  if (dateStr) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      publishedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      publishedDate = new Date(dateStr);
    }
  } else {
    publishedDate = new Date(0);
  }
  return {
    id: row.videoId,
    title: row.title,
    publishedAt: row.publishedAt,
    publishedDate,
    duration: row.duration,
    views: row.views,
    estimatedRevenue: row.estimatedRevenue,
    impressions: row.impressions,
    ctr: row.ctr,
    avgViewRate: row.avgViewRate,
    likeRate: row.likeRate,
    subscriberChange: row.subscriberChange,
    isShort: row.isShort,
    isPrivate: row.isPrivate,
  };
}

/**
 * Returns all videos from DB (falls back to local CSV if DB empty)
 */
export function useVideos(filter?: "all" | "regular" | "short" | "private") {
  const hasDataQuery = trpc.analytics.hasData.useQuery(undefined, {
    staleTime: 30_000,
  });

  const dbQuery = trpc.analytics.getVideos.useQuery(
    { filter: filter || "all", sortBy: "publishedDate", sortOrder: "desc", limit: 600 },
    { enabled: hasDataQuery.data === true, staleTime: 30_000 }
  );

  const isLoading = hasDataQuery.isLoading || (hasDataQuery.data === true && dbQuery.isLoading);
  const hasDbData = hasDataQuery.data === true;

  let videos: VideoData[];
  if (hasDbData && dbQuery.data) {
    videos = dbQuery.data.map(dbRowToVideoData);
    // Apply filter for local fallback compatibility
    if (filter === "regular") videos = videos.filter((v) => !v.isShort && !v.isPrivate);
    else if (filter === "short") videos = videos.filter((v) => v.isShort);
    else if (filter === "private") videos = videos.filter((v) => v.isPrivate);
  } else if (!hasDbData && !hasDataQuery.isLoading) {
    // Fallback to local CSV
    const all = parseVideoData();
    if (filter === "regular") videos = all.filter((v) => !v.isShort && !v.isPrivate);
    else if (filter === "short") videos = all.filter((v) => v.isShort);
    else if (filter === "private") videos = all.filter((v) => v.isPrivate);
    else videos = all;
  } else {
    videos = [];
  }

  return { videos, isLoading, hasDbData };
}

/**
 * Returns channel summary from DB (falls back to local CSV)
 */
export function useChannelSummary() {
  const hasDataQuery = trpc.analytics.hasData.useQuery(undefined, { staleTime: 30_000 });
  const dbQuery = trpc.analytics.getChannelSummary.useQuery(undefined, {
    enabled: hasDataQuery.data === true,
    staleTime: 30_000,
  });

  const isLoading = hasDataQuery.isLoading || (hasDataQuery.data === true && dbQuery.isLoading);
  const hasDbData = hasDataQuery.data === true;

  let summary: ChannelSummary | null = null;
  if (hasDbData && dbQuery.data) {
    summary = dbQuery.data as ChannelSummary;
  } else if (!hasDbData && !hasDataQuery.isLoading) {
    summary = getChannelSummary();
  }

  return { summary, isLoading, hasDbData };
}

/**
 * Returns monthly stats from DB (falls back to local CSV)
 */
export function useMonthlyStats(months = 24) {
  const hasDataQuery = trpc.analytics.hasData.useQuery(undefined, { staleTime: 30_000 });
  const dbQuery = trpc.analytics.getMonthlyStats.useQuery(
    { months },
    { enabled: hasDataQuery.data === true, staleTime: 30_000 }
  );

  const isLoading = hasDataQuery.isLoading || (hasDataQuery.data === true && dbQuery.isLoading);
  const hasDbData = hasDataQuery.data === true;

  let stats: MonthlyStats[] = [];
  if (hasDbData && dbQuery.data) {
    stats = dbQuery.data.map((row) => ({
      month: row.month,
      views: row.views,
      revenue: row.revenue,
      videoCount: row.videoCount,
      subscriberChange: row.subscriberChange,
    }));
  } else if (!hasDbData && !hasDataQuery.isLoading) {
    stats = getLocalMonthlyStats();
  }

  return { stats, isLoading, hasDbData };
}

/**
 * Returns DB channel config (falls back to null)
 */
export function useDbChannelConfig() {
  return trpc.analytics.getChannelConfig.useQuery(undefined, { staleTime: 60_000 });
}

/**
 * Returns last CSV upload info
 */
export function useLastUpload() {
  return trpc.analytics.getLastUpload.useQuery(undefined, { staleTime: 30_000 });
}
