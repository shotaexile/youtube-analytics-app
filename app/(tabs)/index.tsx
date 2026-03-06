import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, getChannelSummary, getMonthlyStats, formatNumber, formatRevenue } from "@/lib/data/csv-parser";
import { IconSymbol } from "@/components/ui/icon-symbol";

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, margin: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
          <IconSymbol name={icon} size={16} color={color} />
        </View>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F0F0F' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#606060', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function MonthlyBarChart({ data }: { data: { month: string; views: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.views));
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 3 }}>
        {data.map((item, i) => {
          const barHeight = max > 0 ? Math.max(4, (item.views / max) * 80) : 4;
          const isLast = i === data.length - 1;
          return (
            <View key={item.month} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 2 }} numberOfLines={1}>
                {formatNumber(item.views)}
              </Text>
              <View style={{ width: '100%', height: barHeight, backgroundColor: isLast ? '#FF0000' : '#FF000060', borderRadius: 3 }} />
            </View>
          );
        })}
      </View>
      {/* X-axis labels: first, middle, last */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{data[0]?.month?.slice(5)}月</Text>
        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{data[Math.floor(data.length / 2)]?.month?.slice(5)}月</Text>
        <Text style={{ fontSize: 10, color: '#FF0000', fontWeight: '600' }}>{data[data.length - 1]?.month?.slice(5)}月</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();

  const summary = useMemo(() => getChannelSummary(), []);
  const monthlyStats = useMemo(() => getMonthlyStats(), []);
  const recentVideos = useMemo(() => parseVideoData().slice(0, 10), []);

  const last12Months = useMemo(() => monthlyStats.slice(-12), [monthlyStats]);

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header */}
        <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '900' }}>YT</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F0F0F' }}>三崎優太</Text>
                <Text style={{ fontSize: 11, color: '#606060' }}>YouTubeアナリティクス</Text>
              </View>
            </View>
            {/* CSV Import Button */}
            <TouchableOpacity
              onPress={() => router.push('/import' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 }}
            >
              <IconSymbol name="paperplane.fill" size={14} color="#606060" />
              <Text style={{ fontSize: 12, color: '#606060', fontWeight: '600' }}>CSV更新</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={{ paddingHorizontal: 12, paddingTop: 16, marginBottom: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#606060', marginBottom: 8, paddingHorizontal: 4 }}>チャンネル概要</Text>
          <View style={{ flexDirection: 'row' }}>
            <SummaryCard label="総視聴回数" value={formatNumber(summary.totalViews)} icon="eye.fill" color="#FF0000" />
            <SummaryCard label="総収益" value={formatRevenue(summary.totalRevenue)} icon="dollarsign.circle.fill" color="#22C55E" />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <SummaryCard label="総再生時間" value={`${formatNumber(Math.round(summary.totalWatchHours))}h`} icon="clock.fill" color="#F59E0B" />
            <SummaryCard label="動画本数" value={`${summary.videoCount}本`} icon="play.rectangle.fill" color="#3B82F6" />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <SummaryCard label="平均CTR" value={`${summary.avgCtr.toFixed(1)}%`} icon="arrow.up.right" color="#8B5CF6" />
            <SummaryCard label="平均高評価率" value={`${summary.avgLikeRate.toFixed(1)}%`} icon="hand.thumbsup.fill" color="#EC4899" />
          </View>
        </View>

        {/* Monthly Views Chart */}
        <View style={{ marginHorizontal: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F' }}>月別視聴回数推移</Text>
              <Text style={{ fontSize: 11, color: '#606060', marginTop: 2 }}>直近12ヶ月（{last12Months[0]?.month} 〜 {last12Months[last12Months.length - 1]?.month}）</Text>
            </View>
            {last12Months.length > 0 && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#606060' }}>最新月</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF0000' }}>
                  {formatNumber(last12Months[last12Months.length - 1]?.views || 0)}
                </Text>
              </View>
            )}
          </View>
          <MonthlyBarChart data={last12Months} />
        </View>

        {/* Recent Videos Section */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F0F0F' }}>動画一覧</Text>
            <TouchableOpacity onPress={() => router.push('/videos' as any)}>
              <Text style={{ fontSize: 12, color: '#FF0000', fontWeight: '600' }}>すべて見る →</Text>
            </TouchableOpacity>
          </View>
          {recentVideos.map((video) => {
            const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
            return (
              <TouchableOpacity
                key={video.id}
                onPress={() => router.push({ pathname: '/video/[id]' as any, params: { id: video.id } })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  backgroundColor: 'white',
                  borderRadius: 14,
                  padding: 10,
                  marginBottom: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 1,
                  gap: 12,
                }}
              >
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={{ width: 110, height: 62, borderRadius: 8, backgroundColor: '#F3F4F6' }}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F0F0F', marginBottom: 5, lineHeight: 18 }} numberOfLines={2}>{video.title}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF0F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, color: '#FF0000', fontWeight: '600' }}>👁 {formatNumber(video.views)}</Text>
                    </View>
                    {video.estimatedRevenue > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, color: '#16A34A', fontWeight: '600' }}>{formatRevenue(video.estimatedRevenue)}</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F5F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, color: '#7C3AED', fontWeight: '600' }}>CTR {video.ctr.toFixed(1)}%</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{video.publishedAt}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
