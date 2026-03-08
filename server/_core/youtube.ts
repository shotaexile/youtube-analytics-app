/**
 * YouTube Data API v3 helper - replaces Manus callDataApi for Vercel deployment
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface YouTubeSearchItem {
  videoId: string;
  title: string;
  channel: string;
  views: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
}

/**
 * Search YouTube videos using Data API v3
 * Drop-in replacement for Manus callDataApi('Youtube/search', ...)
 */
export async function searchYouTube(
  query: string,
  maxResults: number = 5,
  options: { regionCode?: string; relevanceLanguage?: string } = {}
): Promise<YouTubeSearchItem[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    regionCode: options.regionCode ?? "JP",
    relevanceLanguage: options.relevanceLanguage ?? "ja",
    order: "viewCount",
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(`${YOUTUBE_BASE_URL}/search?${params}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error: ${response.status} ${error}`);
  }

  const data = await response.json() as any;
  const items = data.items ?? [];

  // Fetch video statistics for view counts
  const videoIds = items
    .map((item: any) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  let statsMap: Record<string, string> = {};
  if (videoIds) {
    try {
      const statsParams = new URLSearchParams({
        part: "statistics",
        id: videoIds,
        key: YOUTUBE_API_KEY,
      });
      const statsResponse = await fetch(`${YOUTUBE_BASE_URL}/videos?${statsParams}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json() as any;
        for (const item of statsData.items ?? []) {
          const count = parseInt(item.statistics?.viewCount ?? "0");
          statsMap[item.id] = count >= 10000
            ? `${Math.round(count / 10000)}万回視聴`
            : `${count.toLocaleString()}回視聴`;
        }
      }
    } catch {
      // stats fetch failed, use empty map
    }
  }

  return items.map((item: any) => {
    const videoId = item.id?.videoId ?? "";
    const snippet = item.snippet ?? {};
    const publishedAt = snippet.publishedAt
      ? formatRelativeTime(snippet.publishedAt)
      : "";
    return {
      videoId,
      title: snippet.title ?? "",
      channel: snippet.channelTitle ?? "",
      views: statsMap[videoId] ?? "",
      publishedAt,
      thumbnail:
        snippet.thumbnails?.medium?.url ??
        snippet.thumbnails?.default?.url ??
        "",
      description: snippet.description?.slice(0, 100) ?? "",
    };
  });
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "今日";
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}
