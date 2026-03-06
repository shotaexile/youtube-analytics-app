import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, getMonthlyStats, formatNumber } from "@/lib/data/csv-parser";

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32;

type ChartTab = 'monthly' | 'ctr' | 'duration' | 'scatter';

const CHART_TABS: { key: ChartTab; label: string }[] = [
  { key: 'monthly', label: '月別推移' },
  { key: 'ctr', label: 'CTR分布' },
  { key: 'duration', label: '動画長さ' },
  { key: 'scatter', label: '視聴×収益' },
];

function BarChart({ data, color, valueFormat }: { data: { label: string; value: number }[]; color: string; valueFormat: (v: number) => string }) {
  const max = Math.max(...data.map(d => d.value));
  const chartHeight = 160;
  const barWidth = Math.max(8, (CHART_WIDTH - 48) / data.length - 4);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartHeight, paddingLeft: 8 }}>
        {data.map((item, i) => (
          <View key={i} style={{ alignItems: 'center', marginHorizontal: 2 }}>
            <View
              style={{
                width: barWidth,
                height: max > 0 ? Math.max(2, (item.value / max) * chartHeight) : 2,
                backgroundColor: i === data.length - 1 ? color : color + '80',
                borderRadius: 3,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', paddingLeft: 8, marginTop: 4 }}>
        {data.map((item, i) => (
          <View key={i} style={{ width: barWidth + 4, marginHorizontal: 2, alignItems: 'center' }}>
            {(i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) && (
              <Text style={{ fontSize: 9, color: '#606060' }} numberOfLines={1}>{item.label.slice(5)}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function HorizontalBarChart({ data, color, valueFormat }: { data: { label: string; value: number }[]; color: string; valueFormat: (v: number) => string }) {
  const max = Math.max(...data.map(d => d.value));
  const BAR_MAX_WIDTH = CHART_WIDTH - 120;

  return (
    <View style={{ gap: 8 }}>
      {data.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, color: '#606060', width: 60 }} numberOfLines={1}>{item.label}</Text>
          <View style={{ flex: 1, height: 20, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: max > 0 ? (item.value / max) * BAR_MAX_WIDTH : 0, height: 20, backgroundColor: color, borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#0F0F0F', width: 50, textAlign: 'right' }}>{valueFormat(item.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function ScatterPlot({ videos }: { videos: any[] }) {
  const validVideos = videos.filter(v => v.estimatedRevenue > 0);
  const maxViews = Math.max(...validVideos.map(v => v.views));
  const maxRevenue = Math.max(...validVideos.map(v => v.estimatedRevenue));
  const plotWidth = CHART_WIDTH - 60;
  const plotHeight = 180;

  return (
    <View style={{ position: 'relative', height: plotHeight + 30, marginLeft: 40 }}>
      <View style={{ width: plotWidth, height: plotHeight, backgroundColor: '#F9FAFB', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
        {[0.25, 0.5, 0.75].map(p => (
          <View key={p} style={{ position: 'absolute', left: 0, right: 0, top: plotHeight * (1 - p), height: 1, backgroundColor: '#E5E5E5' }} />
        ))}
        {[0.25, 0.5, 0.75].map(p => (
          <View key={p} style={{ position: 'absolute', top: 0, bottom: 0, left: plotWidth * p, width: 1, backgroundColor: '#E5E5E5' }} />
        ))}
        {validVideos.slice(0, 100).map((video) => {
          const x = (video.views / maxViews) * (plotWidth - 16) + 8;
          const y = plotHeight - (video.estimatedRevenue / maxRevenue) * (plotHeight - 16) - 8;
          return (
            <View
              key={video.id}
              style={{
                position: 'absolute',
                left: x - 4,
                top: y - 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FF0000',
                opacity: 0.6,
              }}
            />
          );
        })}
      </View>
      <Text style={{ textAlign: 'center', fontSize: 10, color: '#606060', marginTop: 4 }}>視聴回数 →</Text>
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

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F0F0F', paddingHorizontal: 16, marginBottom: 12 }}>グラフ分析</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {CHART_TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: activeTab === tab.key ? '#FF0000' : '#F3F4F6',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: activeTab === tab.key ? 'white' : '#606060' }}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          {activeTab === 'monthly' && (
            <>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 4 }}>月別視聴回数（直近12ヶ月）</Text>
                <Text style={{ fontSize: 12, color: '#606060', marginBottom: 16 }}>月ごとの総視聴回数の推移</Text>
                <BarChart data={monthlyViewsData} color="#FF0000" valueFormat={formatNumber} />
              </View>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 4 }}>視聴回数TOP月</Text>
                <Text style={{ fontSize: 12, color: '#606060', marginBottom: 16 }}>最も視聴回数が多かった月</Text>
                <HorizontalBarChart data={topMonths} color="#FF0000" valueFormat={formatNumber} />
              </View>
            </>
          )}

          {activeTab === 'ctr' && (
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 4 }}>CTR分布</Text>
              <Text style={{ fontSize: 12, color: '#606060', marginBottom: 16 }}>インプレッションのクリック率の分布（{videos.length}本）</Text>
              <BarChart data={ctrDistribution} color="#8B5CF6" valueFormat={(v) => `${v}本`} />
              <View style={{ marginTop: 16, gap: 8 }}>
                {ctrDistribution.map((bucket, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#8B5CF6' }} />
                      <Text style={{ fontSize: 12, color: '#606060' }}>{bucket.label}</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F0F0F' }}>{bucket.value}本 ({((bucket.value / videos.length) * 100).toFixed(0)}%)</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'duration' && (
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 4 }}>動画の長さ分布</Text>
              <Text style={{ fontSize: 12, color: '#606060', marginBottom: 16 }}>動画の長さ別の本数分布（{videos.length}本）</Text>
              <BarChart data={durationDistribution} color="#F59E0B" valueFormat={(v) => `${v}本`} />
              <View style={{ marginTop: 16, gap: 8 }}>
                {durationDistribution.map((bucket, i) => {
                  const avgViews = videos.filter(v => v.duration >= bucket.min && v.duration < bucket.max).reduce((s, v) => s + v.views, 0) / Math.max(1, bucket.value);
                  return (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#F59E0B' }} />
                        <Text style={{ fontSize: 12, color: '#606060' }}>{bucket.label}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F0F0F' }}>{bucket.value}本</Text>
                        <Text style={{ fontSize: 10, color: '#606060' }}>平均{formatNumber(Math.round(avgViews))}回</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {activeTab === 'scatter' && (
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 4 }}>視聴回数 vs 収益</Text>
              <Text style={{ fontSize: 12, color: '#606060', marginBottom: 16 }}>各動画の視聴回数と収益の相関（収益データあり）</Text>
              <ScatterPlot videos={videos} />
              <View style={{ marginTop: 12, padding: 12, backgroundColor: '#FFF5F5', borderRadius: 10 }}>
                <Text style={{ fontSize: 12, color: '#FF0000', fontWeight: '600' }}>💡 インサイト</Text>
                <Text style={{ fontSize: 12, color: '#606060', marginTop: 4, lineHeight: 18 }}>
                  視聴回数と収益は概ね正の相関があります。ただし、一部の動画は視聴回数が高くても収益が低い傾向があり、広告フォーマットや視聴者層の違いが影響しています。
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
