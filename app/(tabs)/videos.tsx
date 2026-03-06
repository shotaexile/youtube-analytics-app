import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput } from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { formatNumber, formatRevenue, calculatePerformanceScore } from "@/lib/data/csv-parser";
import { useVideos } from "@/lib/data/use-analytics";
import { VideoData, VideoFilter } from "@/lib/data/types";
import { IconSymbol } from "@/components/ui/icon-symbol";

type SortType = 'date' | 'views' | 'revenue' | 'ctr' | 'likeRate' | 'subscribers';

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'date', label: '新しい順' },
  { key: 'views', label: '視聴回数' },
  { key: 'revenue', label: '収益' },
  { key: 'ctr', label: 'CTR' },
  { key: 'likeRate', label: '高評価率' },
  { key: 'subscribers', label: '登録者増減' },
];

const VIDEO_FILTERS: { key: VideoFilter; label: string; color: string }[] = [
  { key: 'all', label: 'すべて', color: '#606060' },
  { key: 'regular', label: '一般動画', color: '#FF0000' },
  { key: 'short', label: 'ショート', color: '#3B82F6' },
];

const GRADE_COLORS: Record<string, string> = {
  S: '#FF0000',
  A: '#F59E0B',
  B: '#22C55E',
  C: '#3B82F6',
  D: '#9CA3AF',
};

function VideoCard({ video }: { video: VideoData }) {
  const router = useRouter();
  const { grade, score } = calculatePerformanceScore(video);
  const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/video/[id]' as any, params: { id: video.id } })}
      style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 10,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        gap: 10,
        opacity: video.isPrivate ? 0.7 : 1,
      }}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ width: 100, height: 56, borderRadius: 8, backgroundColor: '#F3F4F6' }}
          contentFit="cover"
        />
        {video.isShort && (
          <View style={{ position: 'absolute', bottom: 3, left: 3, backgroundColor: '#3B82F6', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ fontSize: 8, color: 'white', fontWeight: '700' }}>SHORT</Text>
          </View>
        )}
        {video.isPrivate && (
          <View style={{ position: 'absolute', bottom: 3, left: 3, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ fontSize: 8, color: 'white', fontWeight: '700' }}>非公開</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F0F0F', marginBottom: 6, lineHeight: 18 }} numberOfLines={2}>{video.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 11, color: '#606060' }}>👁 {formatNumber(video.views)}</Text>
          {video.estimatedRevenue > 0 && (
            <Text style={{ fontSize: 11, color: '#22C55E' }}>{formatRevenue(video.estimatedRevenue)}</Text>
          )}
          <Text style={{ fontSize: 11, color: '#606060' }}>CTR {video.ctr.toFixed(1)}%</Text>
          {video.subscriberChange !== 0 && (
            <Text style={{ fontSize: 11, color: video.subscriberChange > 0 ? '#22C55E' : '#EF4444' }}>
              {video.subscriberChange > 0 ? `+${video.subscriberChange}` : video.subscriberChange}人
            </Text>
          )}
        </View>
        <Text style={{ fontSize: 10, color: '#AAAAAA', marginTop: 4 }}>{video.publishedAt}</Text>
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: GRADE_COLORS[grade] + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: GRADE_COLORS[grade] }}>{grade}</Text>
        </View>
        <Text style={{ fontSize: 9, color: '#AAAAAA', marginTop: 2 }}>{score}pt</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VideosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ grade?: string; filter?: VideoFilter }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('date');
  const [showSearch, setShowSearch] = useState(false);
  const [videoFilter, setVideoFilter] = useState<VideoFilter>(params.filter || 'all');
  const [gradeFilter, setGradeFilter] = useState<string | null>(params.grade || null);

  const { videos: allVideos } = useVideos('all');

  const counts = useMemo(() => ({
    // 'all' shows only public videos (regular + short), excluding private
    all: allVideos.filter((v: VideoData) => !v.isPrivate).length,
    regular: allVideos.filter((v: VideoData) => !v.isShort && !v.isPrivate).length,
    short: allVideos.filter((v: VideoData) => v.isShort).length,
  }), [allVideos]);

  const filteredVideos = useMemo(() => {
    let videos = allVideos;

    // Video type filter
    // 'all' excludes private videos — they belong in the dedicated private videos page
    if (videoFilter === 'all') videos = videos.filter(v => !v.isPrivate);
    else if (videoFilter === 'regular') videos = videos.filter(v => !v.isShort && !v.isPrivate);
    else if (videoFilter === 'short') videos = videos.filter(v => v.isShort);

    // Grade filter
    if (gradeFilter) {
      videos = videos.filter(v => {
        const { grade } = calculatePerformanceScore(v);
        return grade === gradeFilter;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      videos = videos.filter(v => v.title.toLowerCase().includes(q));
    }

    return [...videos].sort((a, b) => {
      switch (sortType) {
        case 'date': return b.publishedDate.getTime() - a.publishedDate.getTime();
        case 'views': return b.views - a.views;
        case 'revenue': return b.estimatedRevenue - a.estimatedRevenue;
        case 'ctr': return b.ctr - a.ctr;
        case 'likeRate': return b.likeRate - a.likeRate;
        case 'subscribers': return b.subscriberChange - a.subscriberChange;
        default: return 0;
      }
    });
  }, [allVideos, searchQuery, sortType, videoFilter, gradeFilter]);

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F0F0F', flex: 1 }}>動画一覧</Text>
          <Text style={{ fontSize: 12, color: '#606060', marginRight: 8 }}>{filteredVideos.length}本</Text>
          <TouchableOpacity
            onPress={() => router.push('/private-videos' as any)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}
          >
            <IconSymbol name="lock.fill" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: showSearch ? '#FF0000' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconSymbol name="magnifyingglass" size={16} color={showSearch ? 'white' : '#606060'} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, height: 36 }}>
            <IconSymbol name="magnifyingglass" size={14} color="#606060" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="動画タイトルを検索..."
              placeholderTextColor="#AAAAAA"
              style={{ flex: 1, fontSize: 13, color: '#0F0F0F', marginLeft: 8 }}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark" size={14} color="#606060" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Grade Filter Badge */}
        {gradeFilter && (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GRADE_COLORS[gradeFilter] + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: GRADE_COLORS[gradeFilter] }}>グレード {gradeFilter}</Text>
              <TouchableOpacity onPress={() => setGradeFilter(null)}>
                <IconSymbol name="xmark" size={12} color={GRADE_COLORS[gradeFilter]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Video Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12 }}>
            {VIDEO_FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setVideoFilter(f.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 16,
                  backgroundColor: videoFilter === f.key ? f.color : '#F3F4F6',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: videoFilter === f.key ? 'white' : '#606060' }}>
                  {f.label}
                </Text>
                <Text style={{ fontSize: 10, color: videoFilter === f.key ? 'rgba(255,255,255,0.8)' : '#9CA3AF' }}>
                  {counts[f.key as keyof typeof counts] ?? 0}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Sort Options */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORT_OPTIONS}
          keyExtractor={item => item.key}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSortType(item.key)}
              style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: sortType === item.key ? '#0F0F0F' : '#F3F4F6' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: sortType === item.key ? 'white' : '#606060' }}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredVideos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <VideoCard video={item} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 14, color: '#606060' }}>動画が見つかりません</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
