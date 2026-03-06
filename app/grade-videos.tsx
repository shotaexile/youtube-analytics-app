import { Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { parseVideoData, formatNumber, formatRevenue, calculatePerformanceScore } from "@/lib/data/csv-parser";
import { VideoData } from "@/lib/data/types";
import { Image } from "expo-image";

const GRADE_COLORS: Record<string, string> = {
  S: '#FF0000',
  A: '#F59E0B',
  B: '#22C55E',
  C: '#3B82F6',
  D: '#9CA3AF',
};

const GRADE_LABELS: Record<string, string> = {
  S: '最高評価 - 突出したパフォーマンス',
  A: '優秀 - 平均を大きく上回る',
  B: '良好 - 平均を上回る',
  C: '普通 - 平均的なパフォーマンス',
  D: '要改善 - 平均を下回る',
};

function VideoCard({ video }: { video: VideoData }) {
  const router = useRouter();
  const { score } = calculatePerformanceScore(video);
  const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/video/[id]' as any, params: { id: video.id } })}
      style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
        gap: 12,
      }}
    >
      <Image
        source={{ uri: thumbnailUrl }}
        style={{ width: 100, height: 56, borderRadius: 8, backgroundColor: '#F3F4F6' }}
        contentFit="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F0F0F', marginBottom: 4 }} numberOfLines={2}>{video.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: '#606060' }}>👁 {formatNumber(video.views)}</Text>
          {video.estimatedRevenue > 0 && (
            <Text style={{ fontSize: 11, color: '#606060' }}>💰 {formatRevenue(video.estimatedRevenue)}</Text>
          )}
        </View>
        <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{video.publishedAt}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#9CA3AF' }}>{score}pt</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function GradeVideosScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const gradeKey = (grade || 'S').toUpperCase();
  const color = GRADE_COLORS[gradeKey] || '#FF0000';

  const videos = useMemo(() => {
    const all = parseVideoData();
    return all
      .map(v => ({ video: v, result: calculatePerformanceScore(v) }))
      .filter(({ result }) => result.grade === gradeKey)
      .sort((a, b) => b.result.score - a.result.score)
      .map(({ video }) => video);
  }, [gradeKey]);

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconSymbol name="chevron.right" size={18} color="#0F0F0F" style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color }}>{gradeKey}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F0F0F' }}>ランク動画</Text>
              <Text style={{ fontSize: 11, color: '#606060' }}>{GRADE_LABELS[gradeKey]}</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: color + '15', borderRadius: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color }}>{videos.length}本</Text>
        </View>
      </View>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard video={item} />}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>このグレードの動画はありません</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
