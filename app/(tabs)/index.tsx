import { ScrollView, Text, View, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, getChannelSummary, getMonthlyStats, formatNumber, formatRevenue } from "@/lib/data/csv-parser";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getChannelConfig, saveChannelConfig, extractChannelId, ChannelConfig } from "@/lib/data/channel-config";
import { VideoFilter } from "@/lib/data/types";

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{data[0]?.month?.slice(5)}月</Text>
        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{data[Math.floor(data.length / 2)]?.month?.slice(5)}月</Text>
        <Text style={{ fontSize: 10, color: '#FF0000', fontWeight: '600' }}>{data[data.length - 1]?.month?.slice(5)}月</Text>
      </View>
    </View>
  );
}

const VIDEO_FILTERS: { key: VideoFilter; label: string; color: string }[] = [
  { key: 'all', label: 'すべて', color: '#606060' },
  { key: 'regular', label: '一般動画', color: '#FF0000' },
  { key: 'short', label: 'ショート', color: '#3B82F6' },
  { key: 'private', label: '非公開', color: '#9CA3AF' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [videoFilter, setVideoFilter] = useState<VideoFilter>('all');
  const [channelConfig, setChannelConfig] = useState<ChannelConfig | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelUrlInput, setChannelUrlInput] = useState('');

  useEffect(() => {
    getChannelConfig().then(setChannelConfig);
  }, []);

  const summary = useMemo(() => getChannelSummary(), []);
  const monthlyStats = useMemo(() => getMonthlyStats(), []);
  const allVideos = useMemo(() => parseVideoData(), []);

  const filteredVideos = useMemo(() => {
    let videos = allVideos;
    if (videoFilter === 'regular') videos = videos.filter(v => !v.isShort && !v.isPrivate);
    else if (videoFilter === 'short') videos = videos.filter(v => v.isShort);
    else if (videoFilter === 'private') videos = videos.filter(v => v.isPrivate);
    return videos.slice(0, 15);
  }, [allVideos, videoFilter]);

  const last12Months = useMemo(() => monthlyStats.slice(-12), [monthlyStats]);

  const handleSaveChannelUrl = async () => {
    if (!channelUrlInput.trim()) {
      Alert.alert('エラー', 'URLを入力してください');
      return;
    }
    const channelId = extractChannelId(channelUrlInput);
    if (!channelId) {
      Alert.alert('エラー', '正しいYouTubeチャンネルURLを入力してください\n例: https://www.youtube.com/@handle');
      return;
    }
    await saveChannelConfig({
      channelUrl: channelUrlInput,
      channelId: channelId,
    });
    const updated = await getChannelConfig();
    setChannelConfig(updated);
    setShowChannelModal(false);
    setChannelUrlInput('');
  };

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header with Channel Info */}
        <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              onPress={() => setShowChannelModal(true)}
            >
              {channelConfig?.iconUrl ? (
                <Image
                  source={{ uri: channelConfig.iconUrl }}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6' }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>YT</Text>
                </View>
              )}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F0F0F' }}>
                    {channelConfig?.channelName || '三崎優太'}
                  </Text>
                  <IconSymbol name="chevron.right" size={12} color="#9CA3AF" />
                </View>
                <Text style={{ fontSize: 11, color: '#606060' }}>YouTubeアナリティクス</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/import' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 }}
            >
              <IconSymbol name="paperplane.fill" size={14} color="#606060" />
              <Text style={{ fontSize: 12, color: '#606060', fontWeight: '600' }}>CSV更新</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Type Stats Bar */}
        <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5', flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FFF0F0', borderRadius: 10, paddingVertical: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#FF0000' }}>{summary.regularCount}</Text>
            <Text style={{ fontSize: 10, color: '#606060', marginTop: 1 }}>一般動画</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#3B82F6' }}>{summary.shortCount}</Text>
            <Text style={{ fontSize: 10, color: '#606060', marginTop: 1 }}>ショート</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, paddingVertical: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#9CA3AF' }}>{summary.privateCount}</Text>
            <Text style={{ fontSize: 10, color: '#606060', marginTop: 1 }}>非公開</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F0F0F' }}>{summary.videoCount}</Text>
            <Text style={{ fontSize: 10, color: '#606060', marginTop: 1 }}>合計</Text>
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
            <SummaryCard label="登録者合計増減" value={summary.totalSubscriberChange >= 0 ? `+${formatNumber(summary.totalSubscriberChange)}` : formatNumber(summary.totalSubscriberChange)} icon="person.badge.plus" color="#F59E0B" />
            <SummaryCard label="動画本数" value={`${summary.videoCount}本`} icon="play.rectangle.fill" color="#3B82F6" />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <SummaryCard label="平均CTR" value={`${summary.avgCtr.toFixed(1)}%`} icon="arrow.up.right" color="#8B5CF6" />
            <SummaryCard label="平均高評価率" value={`${summary.avgLikeRate.toFixed(1)}%`} icon="hand.thumbsup.fill" color="#EC4899" />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <SummaryCard label="平均視聴率" value={`${summary.avgViewRate.toFixed(1)}%`} icon="chart.bar.fill" color="#06B6D4" />
            <SummaryCard label="総インプレッション" value={formatNumber(summary.totalImpressions)} icon="eye.fill" color="#64748B" />
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

        {/* Video List Section with Filter */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F0F0F' }}>動画一覧</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/videos' as any)}>
              <Text style={{ fontSize: 12, color: '#FF0000', fontWeight: '600' }}>すべて見る →</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {VIDEO_FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setVideoFilter(f.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: videoFilter === f.key ? f.color : '#F3F4F6',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: videoFilter === f.key ? 'white' : '#606060' }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {filteredVideos.map((video) => {
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
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={{ width: 110, height: 62, borderRadius: 8, backgroundColor: '#F3F4F6' }}
                    contentFit="cover"
                  />
                  {video.isShort && (
                    <View style={{ position: 'absolute', bottom: 4, left: 4, backgroundColor: '#3B82F6', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 8, color: 'white', fontWeight: '700' }}>SHORT</Text>
                    </View>
                  )}
                  {video.isPrivate && (
                    <View style={{ position: 'absolute', bottom: 4, left: 4, backgroundColor: '#9CA3AF', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 8, color: 'white', fontWeight: '700' }}>非公開</Text>
                    </View>
                  )}
                </View>
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
                    {video.subscriberChange !== 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: video.subscriberChange > 0 ? '#F0FDF4' : '#FFF1F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, color: video.subscriberChange > 0 ? '#16A34A' : '#EF4444', fontWeight: '600' }}>
                          {video.subscriberChange > 0 ? `+${video.subscriberChange}` : video.subscriberChange}人
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{video.publishedAt}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Channel Config Modal */}
      <Modal visible={showChannelModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F0F0F', marginBottom: 8 }}>チャンネル設定</Text>
            <Text style={{ fontSize: 13, color: '#606060', marginBottom: 16, lineHeight: 20 }}>
              YouTubeチャンネルのURLを入力すると、チャンネルアイコンと名前が表示されます。
            </Text>

            {/* Current Channel Preview */}
            {channelConfig?.iconUrl && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <Image
                  source={{ uri: channelConfig.iconUrl }}
                  style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6' }}
                  contentFit="cover"
                />
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F0F0F' }}>{channelConfig.channelName}</Text>
                  <Text style={{ fontSize: 11, color: '#606060' }}>{channelConfig.channelUrl}</Text>
                </View>
              </View>
            )}

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#606060', marginBottom: 6 }}>チャンネルURL</Text>
            <TextInput
              value={channelUrlInput}
              onChangeText={setChannelUrlInput}
              placeholder="https://www.youtube.com/@handle"
              placeholderTextColor="#9CA3AF"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: '#0F0F0F',
                marginBottom: 16,
              }}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setShowChannelModal(false); setChannelUrlInput(''); }}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#606060' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveChannelUrl}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#FF0000', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
