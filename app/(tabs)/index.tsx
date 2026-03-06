import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, getChannelSummary, getMonthlyStats, formatNumber, formatRevenue } from "@/lib/data/csv-parser";
import { useColors } from "@/hooks/use-colors";
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

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 50, gap: 2 }}>
      {data.map((val, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: max > 0 ? Math.max(2, (val / max) * 50) : 2,
            backgroundColor: i === data.length - 1 ? color : color + '60',
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();

  const summary = useMemo(() => getChannelSummary(), []);
  const monthlyStats = useMemo(() => getMonthlyStats(), []);
  const recentVideos = useMemo(() => parseVideoData().slice(0, 10), []);

  const last12Months = monthlyStats.slice(-12);
  const monthlyViews = last12Months.map(m => m.views);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>YT</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F0F0F' }}>三崎優太</Text>
              <Text style={{ fontSize: 12, color: '#606060' }}>YouTubeアナリティクス</Text>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={{ paddingHorizontal: 12, marginBottom: 16 }}>
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
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 4 }}>月別視聴回数推移</Text>
          <Text style={{ fontSize: 12, color: '#606060', marginBottom: 12 }}>直近12ヶ月</Text>
          <MiniBarChart data={monthlyViews} color="#FF0000" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {last12Months.length > 0 && (
              <>
                <Text style={{ fontSize: 10, color: '#606060' }}>{last12Months[0]?.month}</Text>
                <Text style={{ fontSize: 10, color: '#606060' }}>{last12Months[last12Months.length - 1]?.month}</Text>
              </>
            )}
          </View>
        </View>

        {/* Recent Videos */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F' }}>最新動画</Text>
            <TouchableOpacity onPress={() => router.push('/videos' as any)}>
              <Text style={{ fontSize: 12, color: '#FF0000', fontWeight: '600' }}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          {recentVideos.map((video, index) => (
            <TouchableOpacity
              key={video.id}
              onPress={() => router.push({ pathname: '/video/[id]' as any, params: { id: video.id } })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FF0000' + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF0000' }}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F0F0F', marginBottom: 4 }} numberOfLines={2}>{video.title}</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Text style={{ fontSize: 11, color: '#606060' }}>👁 {formatNumber(video.views)}</Text>
                  {video.estimatedRevenue > 0 && (
                    <Text style={{ fontSize: 11, color: '#22C55E' }}>¥ {formatRevenue(video.estimatedRevenue)}</Text>
                  )}
                  <Text style={{ fontSize: 11, color: '#606060' }}>CTR {video.ctr.toFixed(1)}%</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#C0C0C0" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
