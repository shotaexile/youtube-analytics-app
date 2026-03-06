import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { parseVideoData, formatNumber, formatRevenue, formatDuration, calculatePerformanceScore } from "@/lib/data/csv-parser";

const GRADE_COLORS = {
  S: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  A: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  B: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  C: { bg: '#FEFCE8', text: '#CA8A04', border: '#FEF08A' },
  D: { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },
};

export default function PrivateVideosScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<'views' | 'date' | 'grade'>('views');

  const privateVideos = useMemo(() => {
    const all = parseVideoData();
    return all.filter(v => v.isPrivate);
  }, []);

  const sortedVideos = useMemo(() => {
    return [...privateVideos].sort((a, b) => {
      switch (sortBy) {
        case 'views': return b.views - a.views;
        case 'date': return b.publishedDate.getTime() - a.publishedDate.getTime();
        case 'grade': {
          const gradeOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
          const ga = calculatePerformanceScore(a).grade;
          const gb = calculatePerformanceScore(b).grade;
          return gradeOrder[gb] - gradeOrder[ga];
        }
        default: return 0;
      }
    });
  }, [privateVideos, sortBy]);

  const totalViews = privateVideos.reduce((s, v) => s + v.views, 0);
  const totalRevenue = privateVideos.reduce((s, v) => s + (v.estimatedRevenue > 0 ? v.estimatedRevenue : 0), 0);
  const avgCtr = privateVideos.length > 0 ? privateVideos.reduce((s, v) => s + v.ctr, 0) / privateVideos.length : 0;

  const renderItem = ({ item: video, index }: { item: any; index: number }) => {
    const { grade, score } = calculatePerformanceScore(video);
    const gradeStyle = GRADE_COLORS[grade];
    const dateStr = video.publishedDate instanceof Date && !isNaN(video.publishedDate.getTime())
      ? `${video.publishedDate.getFullYear()}/${String(video.publishedDate.getMonth() + 1).padStart(2, '0')}/${String(video.publishedDate.getDate()).padStart(2, '0')}`
      : '不明';

    return (
      <View style={{
        backgroundColor: 'white',
        borderRadius: 14,
        marginBottom: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#9CA3AF',
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          {/* Rank */}
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9CA3AF' }}>{index + 1}</Text>
          </View>
          {/* Title */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#F3F4F6', borderRadius: 6 }}>
                <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>🔒 非公開</Text>
              </View>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: gradeStyle.bg, borderRadius: 6, borderWidth: 1, borderColor: gradeStyle.border }}>
                <Text style={{ fontSize: 10, color: gradeStyle.text, fontWeight: '700' }}>Grade {grade}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F0F0F', lineHeight: 18 }} numberOfLines={2}>
              {video.title || '（タイトル不明）'}
            </Text>
            <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{dateStr} · {formatDuration(video.duration)}</Text>
          </View>
        </View>

        {/* Metrics */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>視聴回数</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F0F0F' }}>{formatNumber(video.views)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>CTR</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#8B5CF6' }}>{video.ctr.toFixed(1)}%</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>収益</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#22C55E' }}>{video.estimatedRevenue > 0 ? formatRevenue(video.estimatedRevenue) : '—'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>スコア</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: gradeStyle.text }}>{score}</Text>
          </View>
        </View>

        {/* Additional metrics */}
        <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>インプレ</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0EA5E9' }}>{formatNumber(video.impressions)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>平均視聴率</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>{video.avgViewRate.toFixed(1)}%</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>高評価率</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#EC4899' }}>{video.likeRate.toFixed(1)}%</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>登録者増減</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: video.subscriberChange >= 0 ? '#22C55E' : '#EF4444' }}>
              {video.subscriberChange >= 0 ? '+' : ''}{video.subscriberChange.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Note about private video */}
        <View style={{ marginTop: 10, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF', flex: 1 }}>
            この動画はYouTubeで非公開または削除されています。YouTube Studioで管理できます。
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconSymbol name="arrow.left" size={18} color="#0F0F0F" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F0F0F' }}>🔒 非公開動画</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>非公開・削除済み動画の一覧</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sortedVideos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            {/* Summary Card */}
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F0F0F', marginBottom: 12 }}>非公開動画 サマリー</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>本数</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F0F0F' }}>{privateVideos.length}</Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>本</Text>
                </View>
                <View style={{ flex: 1, padding: 12, backgroundColor: '#FFF5F5', borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: '#EF4444' }}>総視聴回数</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#EF4444' }}>{formatNumber(totalViews)}</Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>回</Text>
                </View>
                <View style={{ flex: 1, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: '#22C55E' }}>総収益</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#22C55E' }}>{formatRevenue(totalRevenue)}</Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>推定</Text>
                </View>
              </View>
              <View style={{ marginTop: 10, padding: 12, backgroundColor: '#FFFBEB', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 12, color: '#D97706', flex: 1 }}>
                  💡 非公開・削除された動画のデータです。YouTube Studioで再公開や管理が可能です。
                </Text>
              </View>
            </View>

            {/* Sort Options */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'views' as const, label: '視聴回数順' },
                { key: 'date' as const, label: '日付順' },
                { key: 'grade' as const, label: 'グレード順' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSortBy(opt.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: sortBy === opt.key ? '#0F0F0F' : 'white',
                    borderWidth: 1,
                    borderColor: sortBy === opt.key ? '#0F0F0F' : '#E5E5E5',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: sortBy === opt.key ? 'white' : '#606060' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F0F0F', marginBottom: 8 }}>非公開動画はありません</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
              CSVデータに非公開・削除済み動画が含まれていません
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
