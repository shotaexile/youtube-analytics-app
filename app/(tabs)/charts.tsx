import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, getMonthlyStats, formatNumber } from "@/lib/data/csv-parser";

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32;

type ChartTab = 'monthly' | 'ctr' | 'duration' | 'scatter';

const CHART_TABS: { key: ChartTab; label: string; emoji: string }[] = [
  { key: 'monthly', label: '月別推移', emoji: '📈' },
  { key: 'ctr', label: 'CTR分布', emoji: '🎯' },
  { key: 'duration', label: '動画長さ', emoji: '⏱' },
  { key: 'scatter', label: '視聴×収益', emoji: '💰' },
];

// 縦棒グラフ（月別推移用）- 値ラベル付き
function VerticalBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (data.length === 0) return <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>データがありません</Text>;
  const max = Math.max(...data.map(d => d.value));
  const chartHeight = 160;
  const barWidth = Math.max(10, (CHART_WIDTH - 40) / data.length - 5);

  return (
    <View>
      {/* Y-axis labels */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 44, justifyContent: 'space-between', height: chartHeight, paddingBottom: 4 }}>
          {[1, 0.75, 0.5, 0.25, 0].map(p => (
            <Text key={p} style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'right' }}>{formatNumber(Math.round(max * p))}</Text>
          ))}
        </View>
        {/* Chart area */}
        <View style={{ flex: 1 }}>
          {/* Grid lines */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: chartHeight }}>
            {[0, 0.25, 0.5, 0.75, 1].map(p => (
              <View key={p} style={{ position: 'absolute', left: 0, right: 0, top: chartHeight * p, height: 1, backgroundColor: '#F0F0F0' }} />
            ))}
          </View>
          {/* Bars */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartHeight, gap: 3 }}>
            {data.map((item, i) => {
              const barH = max > 0 ? Math.max(3, (item.value / max) * (chartHeight - 4)) : 3;
              const isLast = i === data.length - 1;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ width: '100%', height: barH, backgroundColor: isLast ? color : color + '70', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                </View>
              );
            })}
          </View>
        </View>
      </View>
      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', marginLeft: 44, marginTop: 6, gap: 3 }}>
        {data.map((item, i) => {
          const showLabel = i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              {showLabel && (
                <Text style={{ fontSize: 9, color: i === data.length - 1 ? color : '#9CA3AF', fontWeight: i === data.length - 1 ? '700' : '400' }} numberOfLines={1}>
                  {item.label.slice(2).replace('-', '/')}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      {/* Summary row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>最大</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F0F0F' }}>{formatNumber(max)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>平均</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F0F0F' }}>{formatNumber(Math.round(data.reduce((s, d) => s + d.value, 0) / data.length))}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>最新月</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color }}>{formatNumber(data[data.length - 1]?.value || 0)}</Text>
        </View>
      </View>
    </View>
  );
}

// 横棒グラフ（ランキング・分布用）
function HorizontalBarChart({ data, color, valueFormat }: { data: { label: string; value: number }[]; color: string; valueFormat: (v: number) => string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <View style={{ gap: 10 }}>
      {data.map((item, i) => (
        <View key={i}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: '#444', fontWeight: '500' }}>{item.label}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F0F0F' }}>{valueFormat(item.value)}</Text>
          </View>
          <View style={{ height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' }}>
            <View style={{ width: max > 0 ? `${(item.value / max) * 100}%` as any : '0%', height: 10, backgroundColor: color, borderRadius: 5 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// 分布グラフ（CTR・動画長さ用）
function DistributionBarChart({ data, color, total }: { data: { label: string; value: number; min: number; max: number }[]; color: string; total: number }) {
  const maxVal = Math.max(...data.map(d => d.value));
  const chartHeight = 120;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartHeight, gap: 4 }}>
        {data.map((item, i) => {
          const barH = maxVal > 0 ? Math.max(4, (item.value / maxVal) * chartHeight) : 4;
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: '#606060', marginBottom: 2 }}>{pct}%</Text>
              <View style={{ width: '100%', height: barH, backgroundColor: color, borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: 0.7 + (i / data.length) * 0.3 }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
        {data.map((item, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, color: '#606060', textAlign: 'center' }} numberOfLines={2}>{item.label}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#0F0F0F' }}>{item.value}本</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// 散布図
function ScatterPlot({ videos }: { videos: any[] }) {
  const validVideos = videos.filter(v => v.estimatedRevenue > 0);
  const maxViews = Math.max(...validVideos.map(v => v.views));
  const maxRevenue = Math.max(...validVideos.map(v => v.estimatedRevenue));
  const plotWidth = CHART_WIDTH - 80;
  const plotHeight = 180;

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis */}
        <View style={{ width: 44, height: plotHeight, justifyContent: 'space-between', paddingBottom: 4 }}>
          {[1, 0.5, 0].map(p => (
            <Text key={p} style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'right' }}>{formatNumber(Math.round(maxRevenue * p))}</Text>
          ))}
        </View>
        {/* Plot area */}
        <View style={{ width: plotWidth, height: plotHeight, backgroundColor: '#F9FAFB', borderRadius: 8, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
          {[0.25, 0.5, 0.75].map(p => (
            <View key={`h${p}`} style={{ position: 'absolute', left: 0, right: 0, top: plotHeight * (1 - p), height: 1, backgroundColor: '#E5E5E5' }} />
          ))}
          {[0.25, 0.5, 0.75].map(p => (
            <View key={`v${p}`} style={{ position: 'absolute', top: 0, bottom: 0, left: plotWidth * p, width: 1, backgroundColor: '#E5E5E5' }} />
          ))}
          {validVideos.slice(0, 150).map((video) => {
            const x = (video.views / maxViews) * (plotWidth - 12) + 6;
            const y = plotHeight - (video.estimatedRevenue / maxRevenue) * (plotHeight - 12) - 6;
            return (
              <View
                key={video.id}
                style={{
                  position: 'absolute',
                  left: x - 5,
                  top: y - 5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#FF0000',
                  opacity: 0.55,
                }}
              />
            );
          })}
        </View>
      </View>
      <View style={{ marginLeft: 44, marginTop: 4 }}>
        <Text style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF' }}>視聴回数 →</Text>
      </View>
      <View style={{ position: 'absolute', left: 0, top: plotHeight / 2 - 20 }}>
        <Text style={{ fontSize: 9, color: '#9CA3AF', transform: [{ rotate: '-90deg' }], width: 40, textAlign: 'center' }}>収益</Text>
      </View>
    </View>
  );
}

export default function ChartsScreen() {
  const [activeTab, setActiveTab] = useState<ChartTab>('monthly');
  const videos = useMemo(() => parseVideoData(), []);
  const monthlyStats = useMemo(() => getMonthlyStats(), []);

  const monthlyViewsData = useMemo(() =>
    monthlyStats.slice(-12).map(m => ({ label: m.month, value: m.views })),
    [monthlyStats]
  );

  const monthlyRevenueData = useMemo(() =>
    monthlyStats.slice(-12).map(m => ({ label: m.month, value: m.revenue })),
    [monthlyStats]
  );

  const ctrDistribution = useMemo(() => {
    const buckets = [
      { label: '0-3%', min: 0, max: 3, value: 0 },
      { label: '3-5%', min: 3, max: 5, value: 0 },
      { label: '5-7%', min: 5, max: 7, value: 0 },
      { label: '7-10%', min: 7, max: 10, value: 0 },
      { label: '10-15%', min: 10, max: 15, value: 0 },
      { label: '15%+', min: 15, max: 999, value: 0 },
    ];
    for (const v of videos) {
      const bucket = buckets.find(b => v.ctr >= b.min && v.ctr < b.max);
      if (bucket) bucket.value++;
    }
    return buckets;
  }, [videos]);

  const durationDistribution = useMemo(() => {
    const buckets = [
      { label: '〜3分', min: 0, max: 180, value: 0 },
      { label: '3〜5分', min: 180, max: 300, value: 0 },
      { label: '5〜8分', min: 300, max: 480, value: 0 },
      { label: '8〜12分', min: 480, max: 720, value: 0 },
      { label: '12〜20分', min: 720, max: 1200, value: 0 },
      { label: '20分+', min: 1200, max: 99999, value: 0 },
    ];
    for (const v of videos) {
      const bucket = buckets.find(b => v.duration >= b.min && v.duration < b.max);
      if (bucket) bucket.value++;
    }
    return buckets;
  }, [videos]);

  const topMonths = useMemo(() =>
    [...monthlyStats].sort((a, b) => b.views - a.views).slice(0, 8).map(m => ({ label: m.month, value: m.views })),
    [monthlyStats]
  );

  // Duration avg views
  const durationAvgViews = useMemo(() => {
    return durationDistribution.map(bucket => {
      const matching = videos.filter(v => v.duration >= bucket.min && v.duration < bucket.max);
      const avg = matching.length > 0 ? matching.reduce((s, v) => s + v.views, 0) / matching.length : 0;
      return { label: bucket.label, value: Math.round(avg) };
    });
  }, [videos, durationDistribution]);

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Sticky Header */}
        <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F0F0F', paddingHorizontal: 16, marginBottom: 12 }}>グラフ分析</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {CHART_TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: activeTab === tab.key ? '#FF0000' : '#F3F4F6',
                }}
              >
                <Text style={{ fontSize: 13 }}>{tab.emoji}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: activeTab === tab.key ? 'white' : '#606060' }}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          {/* Monthly Tab */}
          {activeTab === 'monthly' && (
            <>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 2 }}>月別視聴回数（直近12ヶ月）</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>
                  {monthlyViewsData[0]?.label} 〜 {monthlyViewsData[monthlyViewsData.length - 1]?.label}
                </Text>
                <VerticalBarChart data={monthlyViewsData} color="#FF0000" />
              </View>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 2 }}>月別収益（直近12ヶ月）</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>推定収益の月別推移</Text>
                <VerticalBarChart data={monthlyRevenueData} color="#22C55E" />
              </View>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 2 }}>視聴回数TOP月（全期間）</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>最も視聴回数が多かった月ランキング</Text>
                <HorizontalBarChart data={topMonths} color="#FF0000" valueFormat={formatNumber} />
              </View>
            </>
          )}

          {/* CTR Tab */}
          {activeTab === 'ctr' && (
            <>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 2 }}>CTR分布</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>インプレッションのクリック率（{videos.length}本）</Text>
                <DistributionBarChart data={ctrDistribution} color="#8B5CF6" total={videos.length} />
              </View>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 12 }}>CTR帯別の詳細</Text>
                {ctrDistribution.map((bucket, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < ctrDistribution.length - 1 ? 0.5 : 0, borderBottomColor: '#F0F0F0' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: '#8B5CF6', opacity: 0.5 + (i / ctrDistribution.length) * 0.5 }} />
                      <Text style={{ fontSize: 13, color: '#444', fontWeight: '500' }}>{bucket.label}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F0F0F' }}>{bucket.value}本</Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{((bucket.value / videos.length) * 100).toFixed(1)}%</Text>
                    </View>
                  </View>
                ))}
                <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F5F3FF', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, color: '#7C3AED', fontWeight: '600' }}>💡 チャンネル平均CTR</Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#7C3AED', marginTop: 4 }}>
                    {(videos.reduce((s, v) => s + v.ctr, 0) / videos.length).toFixed(2)}%
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>YouTube平均は4〜5%</Text>
                </View>
              </View>
            </>
          )}

          {/* Duration Tab */}
          {activeTab === 'duration' && (
            <>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 2 }}>動画の長さ分布</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>動画の長さ別の本数（{videos.length}本）</Text>
                <DistributionBarChart data={durationDistribution} color="#F59E0B" total={videos.length} />
              </View>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 2 }}>動画長さ別 平均視聴回数</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>どの長さの動画が最も再生されているか</Text>
                <HorizontalBarChart data={durationAvgViews} color="#F59E0B" valueFormat={formatNumber} />
                <View style={{ marginTop: 12, padding: 12, backgroundColor: '#FFFBEB', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, color: '#D97706', fontWeight: '600' }}>💡 最も平均視聴回数が高い長さ</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#D97706', marginTop: 4 }}>
                    {durationAvgViews.reduce((best, d) => d.value > best.value ? d : best, durationAvgViews[0])?.label}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Scatter Tab */}
          {activeTab === 'scatter' && (
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 2 }}>視聴回数 vs 収益</Text>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>各動画の視聴回数と収益の相関（収益データあり {videos.filter(v => v.estimatedRevenue > 0).length}本）</Text>
              <ScatterPlot videos={videos} />
              <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, padding: 12, backgroundColor: '#FFF5F5', borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>収益データあり</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FF0000' }}>{videos.filter(v => v.estimatedRevenue > 0).length}本</Text>
                </View>
                <View style={{ flex: 1, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>収益なし/非公開</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#22C55E' }}>{videos.filter(v => v.estimatedRevenue === 0).length}本</Text>
                </View>
              </View>
              <View style={{ marginTop: 12, padding: 12, backgroundColor: '#FFF5F5', borderRadius: 10 }}>
                <Text style={{ fontSize: 12, color: '#FF0000', fontWeight: '600' }}>💡 インサイト</Text>
                <Text style={{ fontSize: 12, color: '#606060', marginTop: 4, lineHeight: 18 }}>
                  視聴回数と収益は概ね正の相関があります。ただし一部の動画は視聴回数が高くても収益が低い傾向があり、広告フォーマットや視聴者層の違いが影響しています。
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
