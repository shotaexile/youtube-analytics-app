import { ScrollView, Text, View, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { formatNumber, formatRevenue, formatDuration, calculatePerformanceScore } from "@/lib/data/csv-parser";
import { useVideos } from "@/lib/data/use-analytics";
import { analyzeVideo } from "@/lib/data/ai-analysis";
import { IconSymbol } from "@/components/ui/icon-symbol";

const GRADE_COLORS: Record<string, string> = {
  S: '#FF0000',
  A: '#F59E0B',
  B: '#22C55E',
  C: '#3B82F6',
  D: '#9CA3AF',
};

function MetricCard({ label, value, icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: color + '10', borderRadius: 12, padding: 12, margin: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <IconSymbol name={icon} size={14} color={color} />
        <Text style={{ fontSize: 11, color: color, fontWeight: '600' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F0F0F' }}>{value}</Text>
      {sub && <Text style={{ fontSize: 10, color: '#606060', marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { videos: allVideos } = useVideos('all');
  const video = useMemo(() => allVideos.find(v => v.id === id), [allVideos, id]);
  const analysis = useMemo(() => video ? analyzeVideo(video) : null, [video]);
  const { grade, score } = useMemo(() => video ? calculatePerformanceScore(video) : { grade: 'D' as const, score: 0 }, [video]);

  if (!video || !analysis) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#606060' }}>動画が見つかりません</Text>
        </View>
      </ScreenContainer>
    );
  }

  const retentionRate = video.avgViewRate > 0 ? Math.round(video.avgViewRate) : 0;

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <IconSymbol name="arrow.left" size={18} color="#0F0F0F" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F0F0F', flex: 1 }} numberOfLines={1}>動画詳細</Text>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: GRADE_COLORS[grade] + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: GRADE_COLORS[grade] }}>{grade}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Thumbnail */}
        <Image
          source={{ uri: `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg` }}
          style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#F3F4F6' }}
          contentFit="cover"
        />
        {/* Quick Action Buttons */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'white', gap: 10, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
          <TouchableOpacity
            onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#FF0000', borderRadius: 10 }}
          >
            <IconSymbol name="play.fill" size={14} color="white" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>YouTubeで開く</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(`https://studio.youtube.com/video/${video.id}/analytics/tab-overview/period-default`)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#0F0F0F', borderRadius: 10 }}
          >
            <IconSymbol name="chart.bar.fill" size={14} color="white" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>Studio分析</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: 'white', padding: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FF000015', borderRadius: 6 }}>
              <Text style={{ fontSize: 11, color: '#FF0000', fontWeight: '600' }}>{analysis.contentType}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#AAAAAA' }}>{video.publishedAt}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F0F0F', lineHeight: 24, marginBottom: 12 }}>{video.title}</Text>
          <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F0F0F' }}>パフォーマンススコア</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: GRADE_COLORS[grade] }}>{score}pt</Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#E5E5E5', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: `${score}%` as any, height: 8, backgroundColor: GRADE_COLORS[grade], borderRadius: 4 }} />
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: 'white', padding: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 8, paddingHorizontal: 4 }}>主要指標</Text>
          <View style={{ flexDirection: 'row' }}>
            <MetricCard label="視聴回数" value={formatNumber(video.views)} icon="eye.fill" color="#FF0000" />
            <MetricCard label="推定収益" value={video.estimatedRevenue > 0 ? formatRevenue(video.estimatedRevenue) : 'N/A'} icon="dollarsign.circle.fill" color="#22C55E" />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <MetricCard label="平均視聴率" value={`${video.avgViewRate.toFixed(1)}%`} icon="clock.fill" color="#F59E0B" sub="視聴維持率" />
            <MetricCard label="インプレッション" value={formatNumber(video.impressions)} icon="eye.fill" color="#3B82F6" />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <MetricCard label="CTR" value={`${video.ctr.toFixed(1)}%`} icon="arrow.up.right" color="#8B5CF6" sub="クリック率" />
            <MetricCard label="高評価率" value={`${video.likeRate.toFixed(1)}%`} icon="hand.thumbsup.fill" color="#EC4899" />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <MetricCard label="登録者増減" value={video.subscriberChange >= 0 ? `+${video.subscriberChange.toLocaleString()}` : video.subscriberChange.toLocaleString()} icon="person.badge.plus" color={video.subscriberChange >= 0 ? '#22C55E' : '#EF4444'} />
            <MetricCard label="動画の長さ" value={formatDuration(video.duration)} icon="play.rectangle.fill" color="#64748B" />
          </View>
        </View>

        <View style={{ backgroundColor: 'white', padding: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FF000015', alignItems: 'center', justifyContent: 'center' }}>
              <IconSymbol name="brain.head.profile" size={16} color="#FF0000" />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F' }}>AI分析</Text>
          </View>
          <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#0F0F0F', lineHeight: 20 }}>{analysis.summary}</Text>
          </View>
          {analysis.strengths.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <IconSymbol name="star.fill" size={14} color="#22C55E" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#22C55E' }}>強み</Text>
              </View>
              {analysis.strengths.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6, paddingLeft: 4 }}>
                  <Text style={{ fontSize: 12, color: '#22C55E', marginTop: 2 }}>✓</Text>
                  <Text style={{ fontSize: 13, color: '#0F0F0F', flex: 1, lineHeight: 20 }}>{s}</Text>
                </View>
              ))}
            </View>
          )}
          {analysis.weaknesses.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <IconSymbol name="exclamationmark.circle.fill" size={14} color="#F59E0B" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F59E0B' }}>改善点</Text>
              </View>
              {analysis.weaknesses.map((w, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6, paddingLeft: 4 }}>
                  <Text style={{ fontSize: 12, color: '#F59E0B', marginTop: 2 }}>!</Text>
                  <Text style={{ fontSize: 13, color: '#0F0F0F', flex: 1, lineHeight: 20 }}>{w}</Text>
                </View>
              ))}
            </View>
          )}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <IconSymbol name="arrow.up.right" size={14} color="#FF0000" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF0000' }}>改善アクション</Text>
            </View>
            {analysis.improvements.map((imp, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, backgroundColor: '#FFF5F5', borderRadius: 10, padding: 10 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Text style={{ fontSize: 10, color: 'white', fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#0F0F0F', flex: 1, lineHeight: 20 }}>{imp}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
