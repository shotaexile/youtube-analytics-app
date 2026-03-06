import { describe, it, expect } from 'vitest';
import { parseVideoData, getChannelSummary, getTopVideos, calculatePerformanceScore, formatNumber, formatRevenue, formatDuration, getMonthlyStats } from '../lib/data/csv-parser';
import { generateChannelInsights } from '../lib/data/ai-analysis';

describe('CSV Parser', () => {
  it('should parse video data and return array', () => {
    const videos = parseVideoData();
    expect(Array.isArray(videos)).toBe(true);
    expect(videos.length).toBeGreaterThan(0);
  });

  it('should have required fields on each video', () => {
    const videos = parseVideoData();
    const video = videos[0];
    expect(video).toHaveProperty('id');
    expect(video).toHaveProperty('title');
    expect(video).toHaveProperty('views');
    expect(video).toHaveProperty('ctr');
    expect(video).toHaveProperty('likeRate');
    expect(video).toHaveProperty('estimatedRevenue');
    expect(video).toHaveProperty('impressions');
    expect(video).toHaveProperty('publishedDate');
  });

  it('should return valid channel summary', () => {
    const summary = getChannelSummary();
    expect(summary.totalViews).toBeGreaterThan(0);
    expect(summary.videoCount).toBeGreaterThan(0);
    expect(summary.avgCtr).toBeGreaterThan(0);
    expect(summary.avgLikeRate).toBeGreaterThan(0);
  });

  it('should return top videos sorted by views', () => {
    const top = getTopVideos('views', 10);
    expect(top.length).toBeLessThanOrEqual(10);
    for (let i = 0; i < top.length - 1; i++) {
      expect(top[i].views).toBeGreaterThanOrEqual(top[i + 1].views);
    }
  });

  it('should return top videos sorted by revenue', () => {
    const top = getTopVideos('revenue', 5);
    for (let i = 0; i < top.length - 1; i++) {
      expect(top[i].estimatedRevenue).toBeGreaterThanOrEqual(top[i + 1].estimatedRevenue);
    }
  });

  it('should calculate performance score with valid grade', () => {
    const videos = parseVideoData();
    const { score, grade } = calculatePerformanceScore(videos[0]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(grade);
  });

  it('should return monthly stats', () => {
    const stats = getMonthlyStats();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0]).toHaveProperty('month');
    expect(stats[0]).toHaveProperty('views');
  });
});

describe('Format Functions', () => {
  it('should format large numbers correctly', () => {
    expect(formatNumber(100000000)).toContain('億');
    expect(formatNumber(10000)).toContain('万');
    expect(formatNumber(1000)).toContain('千');
    expect(formatNumber(999)).toBe('999');
  });

  it('should format revenue correctly', () => {
    expect(formatRevenue(100000000)).toContain('億');
    expect(formatRevenue(10000)).toContain('万');
    expect(formatRevenue(100000000)).toContain('¥');
  });

  it('should format duration correctly', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(90)).toBe('1:30');
  });
});

describe('AI Analysis', () => {
  it('should generate channel insights', () => {
    const videos = parseVideoData();
    const summary = getChannelSummary();
    const insights = generateChannelInsights(videos, summary);
    
    expect(insights).toHaveProperty('healthScore');
    expect(insights).toHaveProperty('growthTrend');
    expect(insights).toHaveProperty('consistencyScore');
    expect(insights.cards.length).toBeGreaterThan(0);
    expect(insights.priorityActions.length).toBeGreaterThan(0);
  });

  it('should have insight cards with required fields', () => {
    const videos = parseVideoData();
    const summary = getChannelSummary();
    const insights = generateChannelInsights(videos, summary);
    
    for (const card of insights.cards) {
      expect(card).toHaveProperty('title');
      expect(card).toHaveProperty('content');
      expect(card).toHaveProperty('icon');
      expect(card).toHaveProperty('color');
    }
  });
});
