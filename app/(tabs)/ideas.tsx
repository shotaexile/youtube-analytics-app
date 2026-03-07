import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Image, Linking, Platform
} from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

// ── 型定義 ──────────────────────────────────────────────────────────────────
type TrendVideo = {
  videoId: string;
  title: string;
  channel: string;
  views: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
};

type TrendCategory = {
  category: string;
  videos: TrendVideo[];
};

type IdeaItem = {
  title: string;
  concept: string;
  titleOptions: string[];
  thumbnailConcept: string;
  whyBuzz: string;
  buzzScore: number;
  estimatedCtr: string;
  category: string;
  trendKeyword: string;
};

type SelectedTrend = {
  title: string;
  category: string;
  views?: string;
};

// ── バズスコアカラー ──────────────────────────────────────────────────────────
function getBuzzColor(score: number): string {
  if (score >= 85) return '#DC2626';
  if (score >= 70) return '#EA580C';
  if (score >= 55) return '#D97706';
  return '#6B7280';
}

function getBuzzLabel(score: number): string {
  if (score >= 85) return '超バズ確定';
  if (score >= 70) return 'バズ期待大';
  if (score >= 55) return '伸びる可能性あり';
  return '要改善';
}

// ── バズスコアメーター ────────────────────────────────────────────────────────
function BuzzMeter({ score }: { score: number }) {
  const color = getBuzzColor(score);
  const label = getBuzzLabel(score);
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 5, borderColor: color, alignItems: 'center', justifyContent: 'center', backgroundColor: color + '15' }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color }}>{score}</Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: '700', color, marginTop: 4, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// ── 企画カード ────────────────────────────────────────────────────────────────
function IdeaCard({ idea, index }: { idea: IdeaItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const buzzColor = getBuzzColor(idea.buzzScore);

  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      borderLeftWidth: 4,
      borderLeftColor: buzzColor,
    }}>
      {/* ヘッダー */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: buzzColor + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: buzzColor }}>#{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 10, color: '#606060', fontWeight: '600' }}>{idea.category}</Text>
            </View>
            <View style={{ backgroundColor: buzzColor + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 10, color: buzzColor, fontWeight: '700' }}>CTR予測 {idea.estimatedCtr}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F0F0F', lineHeight: 22 }}>{idea.title}</Text>
        </View>
        <BuzzMeter score={idea.buzzScore} />
      </View>

      {/* コンセプト */}
      <View style={{ backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 }}>💡 企画コンセプト</Text>
        <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>{idea.concept}</Text>
      </View>

      {/* タイトル案 */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F0F0F', marginBottom: 8 }}>📝 タイトル案（3パターン）</Text>
        {(idea.titleOptions || []).map((title, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: i === 0 ? '#FF0000' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: i === 0 ? 'white' : '#9CA3AF' }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: '#374151', lineHeight: 20, fontWeight: i === 0 ? '600' : '400' }}>{title}</Text>
          </View>
        ))}
      </View>

      {/* 展開ボタン */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' }}
      >
        <Text style={{ fontSize: 12, color: '#606060', fontWeight: '600' }}>{expanded ? '▲ 詳細を閉じる' : '▼ サムネイル案・バズ理由を見る'}</Text>
      </TouchableOpacity>

      {/* 展開コンテンツ */}
      {expanded && (
        <View style={{ marginTop: 14, gap: 12 }}>
          {/* サムネイル案 */}
          <View style={{ backgroundColor: '#FFF5F5', borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 11, color: '#FF0000', fontWeight: '700', marginBottom: 6 }}>🖼 サムネイル構成案</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>{idea.thumbnailConcept}</Text>
          </View>

          {/* バズ理由 */}
          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '700', marginBottom: 6 }}>🔥 なぜバズるか（データ根拠）</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>{idea.whyBuzz}</Text>
          </View>

          {/* トレンドキーワード */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, color: '#9CA3AF' }}>参照トレンド:</Text>
            <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '600' }}>{idea.trendKeyword}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── トレンド動画カード ────────────────────────────────────────────────────────
function TrendVideoCard({ video, selected, onToggle }: {
  video: TrendVideo;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        width: 180,
        marginRight: 12,
        backgroundColor: selected ? '#FFF5F5' : 'white',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: selected ? '#FF0000' : '#F0F0F0',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* サムネイル */}
      <View style={{ width: '100%', height: 100, backgroundColor: '#F3F4F6', position: 'relative' }}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>🎬</Text>
          </View>
        )}
        {selected && (
          <View style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '900' }}>✓</Text>
          </View>
        )}
      </View>
      {/* 情報 */}
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F0F0F', lineHeight: 16 }} numberOfLines={2}>{video.title}</Text>
        <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }} numberOfLines={1}>{video.channel}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: '#606060' }}>{video.views}</Text>
          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{video.publishedAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── メイン画面 ────────────────────────────────────────────────────────────────
export default function IdeasScreen() {
  const [selectedTrends, setSelectedTrends] = useState<SelectedTrend[]>([]);
  const [generatedIdeas, setGeneratedIdeas] = useState<IdeaItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<TrendVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'trends' | 'ideas'>('trends');

  const CATEGORIES = ['all', 'ビジネス・お金', '暴露・炎上', '詐欺・事件', '投資・副業', 'エンタメ・話題'];

  // トレンド動画取得
  const { data: trendData, isLoading: isTrendLoading, refetch: refetchTrends } = trpc.analytics.getTrendingVideos.useQuery(
    { category: activeCategory === 'all' ? undefined : activeCategory },
    { staleTime: 1000 * 60 * 10 } // 10分キャッシュ
  );

  // 深掘り検索
  const searchDetailQuery = trpc.analytics.searchTrendDetail.useQuery(
    { keyword: searchKeyword },
    { enabled: false }
  );

  // AI企画生成
  const generateIdeasMutation = trpc.analytics.generateIdeas.useMutation({
    onSuccess: (data) => {
      setGeneratedIdeas(data.ideas || []);
      setActiveTab('ideas');
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchTrends();
    setRefreshing(false);
  }, [refetchTrends]);

  const toggleTrend = (video: TrendVideo, category: string) => {
    const exists = selectedTrends.find(t => t.title === video.title);
    if (exists) {
      setSelectedTrends(prev => prev.filter(t => t.title !== video.title));
    } else {
      if (selectedTrends.length >= 5) return; // 最大5件
      setSelectedTrends(prev => [...prev, { title: video.title, category, views: video.views }]);
    }
  };

  const handleGenerate = () => {
    if (selectedTrends.length === 0) return;
    setIsGenerating(true);
    generateIdeasMutation.mutate({ selectedTrends });
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    setIsSearching(true);
    try {
      const result = await searchDetailQuery.refetch();
      setSearchResults(result.data?.videos || []);
    } finally {
      setIsSearching(false);
    }
  };

  const allTrendVideos: { video: TrendVideo; category: string }[] = [];
  if (trendData?.trends) {
    for (const cat of trendData.trends) {
      for (const v of cat.videos) {
        allTrendVideos.push({ video: v, category: cat.category });
      }
    }
  }

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" colors={['#FF0000']} />
        }
      >
        {/* Sticky Header */}
        <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F0F0F' }}>🔥 企画提案AI</Text>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>トレンド×過去データでバズ企画を自動生成</Text>
            </View>
            {selectedTrends.length > 0 && (
              <View style={{ backgroundColor: '#FF0000', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 12, color: 'white', fontWeight: '700' }}>{selectedTrends.length}件選択中</Text>
              </View>
            )}
          </View>

          {/* タブ切り替え */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8 }}>
            <TouchableOpacity
              onPress={() => setActiveTab('trends')}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12,
                backgroundColor: activeTab === 'trends' ? '#FF0000' : '#F3F4F6',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'trends' ? 'white' : '#606060' }}>
                📡 トレンド収集
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('ideas')}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12,
                backgroundColor: activeTab === 'ideas' ? '#FF0000' : '#F3F4F6',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'ideas' ? 'white' : '#606060' }}>
                💡 企画提案 {generatedIdeas.length > 0 ? `(${generatedIdeas.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ padding: 16, gap: 16 }}>

          {/* ── トレンド収集タブ ── */}
          {activeTab === 'trends' && (
            <>
              {/* 検索バー */}
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F0F0F', marginBottom: 10 }}>🔍 キーワードで深掘り検索</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={searchKeyword}
                    onChangeText={setSearchKeyword}
                    placeholder="例: ホストクラブ規制、詐欺師逮捕..."
                    placeholderTextColor="#9CA3AF"
                    style={{
                      flex: 1, height: 42, backgroundColor: '#F8F8F8', borderRadius: 10,
                      paddingHorizontal: 12, fontSize: 13, color: '#0F0F0F',
                    }}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                  <TouchableOpacity
                    onPress={handleSearch}
                    style={{ width: 42, height: 42, backgroundColor: '#FF0000', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isSearching ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={{ fontSize: 18 }}>🔍</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 検索結果 */}
                {searchResults.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>検索結果（タップで企画生成に追加）</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {searchResults.map((video, i) => (
                        <TrendVideoCard
                          key={i}
                          video={video}
                          selected={!!selectedTrends.find(t => t.title === video.title)}
                          onToggle={() => toggleTrend(video, searchKeyword)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* カテゴリフィルター */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: activeCategory === cat ? '#FF0000' : '#F3F4F6',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: activeCategory === cat ? 'white' : '#606060' }}>
                      {cat === 'all' ? '🌐 全て' : cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* トレンド動画一覧 */}
              {isTrendLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#FF0000" />
                  <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>YouTubeトレンドを収集中...</Text>
                </View>
              ) : (
                <>
                  {(trendData?.trends || []).map((cat, ci) => (
                    <View key={ci} style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F' }}>{cat.category}</Text>
                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{cat.videos.length}件</Text>
                      </View>
                      {cat.videos.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }} contentContainerStyle={{ paddingHorizontal: 4 }}>
                          {cat.videos.map((video: TrendVideo, vi: number) => (
                            <TrendVideoCard
                              key={vi}
                              video={video}
                              selected={!!selectedTrends.find(t => t.title === video.title)}
                              onToggle={() => toggleTrend(video, cat.category)}
                            />
                          ))}
                        </ScrollView>
                      ) : (
                        <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 }}>データを取得できませんでした</Text>
                      )}
                    </View>
                  ))}
                </>
              )}

              {/* 選択済みトレンド */}
              {selectedTrends.length > 0 && (
                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 12 }}>✅ 選択中のトレンド（{selectedTrends.length}/5件）</Text>
                  {selectedTrends.map((t, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: i < selectedTrends.length - 1 ? 0.5 : 0, borderBottomColor: '#F0F0F0' }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF0000' }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F0F0F' }} numberOfLines={1}>{t.title}</Text>
                        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{t.category}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedTrends(prev => prev.filter(s => s.title !== t.title))}>
                        <Text style={{ fontSize: 18, color: '#9CA3AF' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* AI企画生成ボタン */}
              <TouchableOpacity
                onPress={handleGenerate}
                disabled={selectedTrends.length === 0 || isGenerating}
                style={{
                  backgroundColor: selectedTrends.length === 0 ? '#E5E7EB' : '#FF0000',
                  borderRadius: 16,
                  padding: 18,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10,
                  shadowColor: '#FF0000',
                  shadowOpacity: selectedTrends.length > 0 ? 0.3 : 0,
                  shadowRadius: 12,
                  elevation: selectedTrends.length > 0 ? 4 : 0,
                }}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: 'white' }}>AIが企画を考えています...</Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 20 }}>🤖</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: selectedTrends.length === 0 ? '#9CA3AF' : 'white' }}>
                      {selectedTrends.length === 0 ? 'トレンドを選択してください' : `${selectedTrends.length}件のトレンドで企画を生成`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── 企画提案タブ ── */}
          {activeTab === 'ideas' && (
            <>
              {generatedIdeas.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 60, gap: 16 }}>
                  <Text style={{ fontSize: 48 }}>💡</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F0F0F', textAlign: 'center' }}>まだ企画がありません</Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 }}>
                    「トレンド収集」タブでトレンドを選択し、{'\n'}AIに企画を生成させてください
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab('trends')}
                    style={{ backgroundColor: '#FF0000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>トレンドを見る →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* サマリーバナー */}
                  <View style={{ backgroundColor: '#FF0000', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Text style={{ fontSize: 36 }}>🎯</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: 'white' }}>AI企画提案 {generatedIdeas.length}本</Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                        過去{'\u306e'}勝ちパターン × 最新トレンドで生成
                      </Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                        バズスコア最高: {Math.max(...generatedIdeas.map(i => i.buzzScore))}点
                      </Text>
                    </View>
                  </View>

                  {/* 企画カード一覧 */}
                  {generatedIdeas.map((idea, i) => (
                    <IdeaCard key={i} idea={idea} index={i} />
                  ))}

                  {/* 再生成ボタン */}
                  <TouchableOpacity
                    onPress={() => setActiveTab('trends')}
                    style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#FF0000' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF0000' }}>🔄 別のトレンドで再生成する</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
