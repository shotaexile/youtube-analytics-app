export interface VideoData {
  id: string;
  title: string;
  publishedAt: string;
  duration: number; // seconds
  likeRate: number; // percentage (高評価率)
  avgViewRate: number; // percentage (平均視聴率)
  views: number;
  subscriberChange: number; // チャンネル登録者増減
  estimatedRevenue: number; // JPY
  impressions: number;
  ctr: number; // percentage
  publishedDate: Date;
  isShort: boolean; // 60秒以下 = ショート動画
  isPrivate: boolean; // サムネイル取得不可 = 非公開/削除済み
}

export interface ChannelSummary {
  totalViews: number;
  totalRevenue: number;
  totalImpressions: number;
  avgCtr: number;
  avgLikeRate: number;
  avgViewRate: number;
  totalSubscriberChange: number;
  videoCount: number;
  shortCount: number;
  regularCount: number;
  privateCount: number;
}

export interface MonthlyStats {
  month: string; // "YYYY-MM"
  views: number;
  revenue: number;
  videoCount: number;
  subscriberChange: number;
}

export interface PerformanceScore {
  overall: number; // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  viewsScore: number;
  revenueScore: number;
  engagementScore: number;
  ctrScore: number;
}

export type RankingType = 'views' | 'revenue' | 'ctr' | 'likeRate' | 'subscribers' | 'impressions' | 'avgViewRate';
export type PeriodFilter = 'all' | '3months' | '6months' | '1year';
export type VideoFilter = 'all' | 'regular' | 'short' | 'private';
