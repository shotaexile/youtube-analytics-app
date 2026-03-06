import { Text, View, TouchableOpacity, FlatList, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, formatNumber, formatRevenue, calculatePerformanceScore } from "@/lib/data/csv-parser";
import { VideoData } from "@/lib/data/types";
import { IconSymbol } from "@/components/ui/icon-symbol";

type SortType = 'date' | 'views' | 'revenue' | 'ctr' | 'likeRate';

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'date', label: '新しい順' },
  { key: 'views', label: '視聴回数' },
  { key: 'revenue', label: '収益' },
  { key: 'ctr', label: 'CTR' },
  { key: 'likeRate', label: '高評価率' },
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

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/video/[id]' as any, params: { id: video.id } })}
      style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <View style={{ width: 80, height: 52, borderRadius: 8, backgroundColor: '#FF000015', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <IconSymbol name="play.rectangle.fill" size={24} color="#FF0000" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F0F0F', marginBottom: 6, lineHeight: 18 }} numberOfLines={2}>{video.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 11, color: '#606060' }}>視聴 {formatNumber(video.views)}</Text>
          {video.estimatedRevenue > 0 && (
            <Text style={{ fontSize: 11, color: '#22C55E' }}>{formatRevenue(video.estimatedRevenue)}</Text>
          )}
          <Text style={{ fontSize: 11, color: '#606060' }}>CTR {video.ctr.toFixed(1)}%</Text>
        </View>
        <Text style={{ fontSize: 10, color: '#AAAAAA', marginTop: 4 }}>{video.publishedAt}</Text>
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: GRADE_COLORS[grade] + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: GRADE_COLORS[grade] }}>{grade}</Text>
        </View>
        <Text style={{ fontSize: 9, color: '#AAAAAA', marginTop: 2 }}>{score}pt</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VideosScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('date');
  const [showSearch, setShowSearch] = useState(false);

  const allVideos = useMemo(() => parseVideoData(), []);

  const filteredVideos = useMemo(() => {
    let videos = allVideos;
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
        default: return 0;
      }
    });
  }, [allVideos, searchQuery, sortType]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F0F0F', flex: 1 }}>動画一覧</Text>
          <Text style={{ fontSize: 12, color: '#606060', marginRight: 12 }}>{filteredVideos.length}本</Text>
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: showSearch ? '#FF0000' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconSymbol name="magnifyingglass" size={16} color={showSearch ? 'white' : '#606060'} />
          </TouchableOpacity>
        </View>
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
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORT_OPTIONS}
          keyExtractor={item => item.key}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSortType(item.key)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: sortType === item.key ? '#FF0000' : '#F3F4F6' }}
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
