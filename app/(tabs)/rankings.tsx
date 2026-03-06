import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { getTopVideos, formatNumber, formatRevenue } from "@/lib/data/csv-parser";
import { RankingType, PeriodFilter } from "@/lib/data/types";
import { IconSymbol } from "@/components/ui/icon-symbol";

const RANKING_TYPES: { key: RankingType; label: string; icon: any; color: string; format: (v: number) => string }[] = [
  { key: 'views', label: '視聴回数', icon: 'eye.fill', color: '#FF0000', format: formatNumber },
  { key: 'revenue', label: '収益', icon: 'dollarsign.circle.fill', color: '#22C55E', format: formatRevenue },
  { key: 'watchHours', label: '再生時間', icon: 'clock.fill', color: '#F59E0B', format: (v) => `${formatNumber(Math.round(v))}h` },
  { key: 'ctr', label: 'CTR', icon: 'arrow.up.right', color: '#8B5CF6', format: (v) => `${v.toFixed(1)}%` },
  { key: 'likeRate', label: '高評価率', icon: 'hand.thumbsup.fill', color: '#EC4899', format: (v) => `${v.toFixed(1)}%` },
];

const PERIOD_FILTERS: { key: PeriodFilter; label: string }[] = [
  { key: 'all', label: '全期間' },
  { key: '1year', label: '1年' },
  { key: '6months', label: '6ヶ月' },
  { key: '3months', label: '3ヶ月' },
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

  const currentType = RANKING_TYPES.find(t => t.key === rankingType)!;
  const videos = useMemo(() => getTopVideos(rankingType, 20, period), [rankingType, period]);

  const getValue = (video: any) => {
    switch (rankingType) {
      case 'views': return video.views;
      case 'revenue': return video.estimatedRevenue;
      case 'watchHours': return video.totalWatchHours;
      case 'ctr': return video.ctr;
      case 'likeRate': return video.likeRate;
      default: return 0;
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
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
              <Image
                source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                style={{ width: 88, height: 50, borderRadius: 6, backgroundColor: '#F3F4F6', marginRight: 10 }}
                contentFit="cover"
              />
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
