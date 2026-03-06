export interface VideoData {
  id: string;
  title: string;
  publishedAt: string;
  duration: number; // seconds
  likeRate: number; // percentage
  avgViewDuration: string; // "HH:MM:SS"
  avgViewDurationSeconds: number;
  views: number;
  totalWatchHours: number;
  subscribers: number;
  estimatedRevenue: number; // JPY
  impressions: number;
  ctr: number; // percentage
  publishedDate: Date;
}

export interface ChannelSummary {
  totalViews: number;
  totalWatchHours: number;
  totalRevenue: number;
  totalImpressions: number;
  avgCtr: number;
  avgLikeRate: number;
  videoCount: number;
}

export interface MonthlyStats {
  month: string; // "YYYY-MM"
  views: number;
  revenue: number;
  videoCount: number;
  watchHours: number;
}

export interface PerformanceScore {
  overall: number; // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  viewsScore: number;
  revenueScore: number;
  engagementScore: number;
  ctrScore: number;
}

export type RankingType = 'views' | 'revenue' | 'watchHours' | 'ctr' | 'likeRate';
export type PeriodFilter = 'all' | '3months' | '6months' | '1year';
