import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { formatNumber, formatRevenue } from "@/lib/data/csv-parser";
import { useVideos } from "@/lib/data/use-analytics";
import { RankingType, PeriodFilter, VideoFilter } from "@/lib/data/types";
import { IconSymbol } from "@/components/ui/icon-symbol";

const RANKING_TYPES: { key: RankingType; label: string; icon: any; color: string; format: (v: number) => string }[] = [
  { key: 'views', label: '視聴回数', icon: 'eye.fill', color: '#FF0000', format: formatNumber },
  { key: 'revenue', label: '収益', icon: 'dollarsign.circle.fill', color: '#22C55E', format: formatRevenue },
  { key: 'impressions', label: 'インプレ', icon: 'chart.bar.fill', color: '#0EA5E9', format: formatNumber },
  { key: 'avgViewRate', label: '平均視聴率', icon: 'play.fill', color: '#F97316', format: (v) => `${v.toFixed(1)}%` },
  { key: 'subscribers', label: '登録者増減', icon: 'person.badge.plus', color: '#F59E0B', format: (v) => v >= 0 ? `+${v.toLocaleString()}` : v.toLocaleString() },
  { key: 'ctr', label: 'CTR', icon: 'arrow.up.right', color: '#8B5CF6', format: (v) => `${v.toFixed(1)}%` },
  { key: 'likeRate', label: '高評価率', icon: 'hand.thumbsup.fill', color: '#EC4899', format: (v) => `${v.toFixed(1)}%` },
];

const PERIOD_FILTERS: { key: PeriodFilter; label: string }[] = [
  { key: 'all', label: '全期間' },
  { key: '1year', label: '1年' },
  { key: '6months', label: '6ヶ月' },
  { key: '3months', label: '3ヶ月' },
];

const VIDEO_FILTERS: { key: VideoFilter; label: string; color: string }[] = [
  { key: 'all', label: 'すべて', color: '#606060' },
  { key: 'regular', label: '一般動画', color: '#FF0000' },
  { key: 'short', label: 'ショート', color: '#3B82F6' },
];

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Text style={{ fontSize: 20 }}>🥇</Text>;
  if (rank === 2) return <Text style={{ fontSize: 20 }}>🥈</Text>;
  if (rank === 3) return <Text style={{ fontSize: 20 }}>🥉</Text>;
  return (
    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#606060' }}>{rank}</Text>
    </View>
  );
}

export default function RankingsScreen() {
  const router = useRouter();
  const [rankingType, setRankingType] = useState<RankingType>('views');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [videoFilter, setVideoFilter] = useState<VideoFilter>('all');

  const currentType = RANKING_TYPES.find(t => t.key === rankingType)!;

  const { videos: allVideos } = useVideos('all');

  const videos = useMemo(() => {
    let filtered = allVideos;

    // Period filter
    if (period !== 'all') {
      const now = new Date();
      const months = period === '3months' ? 3 : period === '6months' ? 6 : 12;
      const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
      filtered = filtered.filter(v => v.publishedDate >= cutoff);
    }

    // Video type filter
    // 'all' excludes private videos — they are in the dedicated private videos page
    if (videoFilter === 'all') filtered = filtered.filter(v => !v.isPrivate);
    else if (videoFilter === 'regular') filtered = filtered.filter(v => !v.isShort && !v.isPrivate);
    else if (videoFilter === 'short') filtered = filtered.filter(v => v.isShort);

    // Sort by ranking type
    return [...filtered].sort((a, b) => {
      switch (rankingType) {
        case 'views': return b.views - a.views;
        case 'revenue': return b.estimatedRevenue - a.estimatedRevenue;
        case 'impressions': return b.impressions - a.impressions;
        case 'avgViewRate': return b.avgViewRate - a.avgViewRate;
        case 'subscribers': return b.subscriberChange - a.subscriberChange;
        case 'ctr': return b.ctr - a.ctr;
        case 'likeRate': return b.likeRate - a.likeRate;
        default: return 0;
      }
    }).slice(0, 20);
  }, [rankingType, period, videoFilter]);

  const getValue = (video: any) => {
    switch (rankingType) {
      case 'views': return video.views;
      case 'revenue': return video.estimatedRevenue;
      case 'impressions': return video.impressions;
      case 'avgViewRate': return video.avgViewRate;
      case 'subscribers': return video.subscriberChange;
      case 'ctr': return video.ctr;
      case 'likeRate': return video.likeRate;
      default: return 0;
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Sticky Header */}
        <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F0F0F', paddingHorizontal: 16, marginBottom: 12 }}>ランキング</Text>

          {/* Ranking Type Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {RANKING_TYPES.map(type => (
              <TouchableOpacity
                key={type.key}
                onPress={() => setRankingType(type.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: rankingType === type.key ? type.color : '#F3F4F6',
                }}
              >
                <IconSymbol name={type.icon} size={14} color={rankingType === type.key ? 'white' : '#606060'} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: rankingType === type.key ? 'white' : '#606060' }}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Period Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 6, marginTop: 8 }}>
            {PERIOD_FILTERS.map(p => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor: period === p.key ? '#0F0F0F' : '#F3F4F6',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: period === p.key ? 'white' : '#606060' }}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Video Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 6, marginTop: 8 }}>
            {VIDEO_FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setVideoFilter(f.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor: videoFilter === f.key ? f.color : '#F3F4F6',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: videoFilter === f.key ? 'white' : '#606060' }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Result Count */}
          <Text style={{ fontSize: 11, color: '#9CA3AF', paddingHorizontal: 16, marginTop: 8 }}>
            {videos.length}本を表示中
          </Text>
        </View>

        {/* Ranking List */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
          {videos.map((video, index) => (
            <TouchableOpacity
              key={video.id}
              onPress={() => router.push({ pathname: '/video/[id]' as any, params: { id: video.id } })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: 14,
                padding: 12,
                marginBottom: 8,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 1,
                borderLeftWidth: index < 3 ? 3 : 0,
                borderLeftColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
              }}
            >
              <View style={{ width: 32, alignItems: 'center', marginRight: 8 }}>
                <MedalIcon rank={index + 1} />
              </View>
              <View style={{ position: 'relative', marginRight: 10 }}>
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                  style={{ width: 88, height: 50, borderRadius: 6, backgroundColor: '#F3F4F6' }}
                  contentFit="cover"
                />
                {video.isShort && (
                  <View style={{ position: 'absolute', bottom: 3, left: 3, backgroundColor: '#3B82F6', borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 7, color: 'white', fontWeight: '700' }}>SHORT</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F0F0F', marginBottom: 4, lineHeight: 17 }} numberOfLines={2}>{video.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: currentType.color + '15', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 }}>
                    <IconSymbol name={currentType.icon} size={11} color={currentType.color} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: currentType.color }}>{currentType.format(getValue(video))}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{video.publishedAt}</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={14} color="#C0C0C0" />
            </TouchableOpacity>
          ))}
          {videos.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 14, color: '#606060' }}>この期間のデータがありません</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
