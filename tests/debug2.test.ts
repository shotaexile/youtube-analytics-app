import { describe, it } from 'vitest';
import { getMonthlyStats, getTopVideos, parseVideoData } from '../lib/data/csv-parser';

describe('Debug', () => {
  it('monthly stats', () => {
    const m = getMonthlyStats();
    console.log('Monthly count:', m.length);
    console.log('Last 3:', JSON.stringify(m.slice(-3)));
    
    const t3 = getTopVideos('views', 3, '3months');
    console.log('3months count:', t3.length, t3.map(v => v.publishedAt));
    
    const t6 = getTopVideos('views', 3, '6months');
    console.log('6months count:', t6.length);
    
    const t12 = getTopVideos('views', 3, '12months');
    console.log('12months count:', t12.length);
    
    const all = parseVideoData();
    console.log('Total videos:', all.length);
    // Check date parsing
    const sample = all.slice(0, 3).map(v => ({ pub: v.publishedAt, date: v.publishedDate?.toISOString() }));
    console.log('Sample dates:', JSON.stringify(sample));
  });
});
