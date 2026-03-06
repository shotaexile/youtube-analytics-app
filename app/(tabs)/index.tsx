import { ScrollView, Text, View, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";
import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, getChannelSummary, getMonthlyStats, formatNumber, formatRevenue } from "@/lib/data/csv-parser";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getChannelConfig, saveChannelConfig, extractChannelId, ChannelConfig } from "@/lib/data/channel-config";
import { VideoFilter } from "@/lib/data/types";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";

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
  const [channelIconUrlInput, setChannelIconUrlInput] = useState('');
  const [channelNameInput, setChannelNameInput] = useState('');

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

  const [isFetchingChannel, setIsFetchingChannel] = useState(false);
  const channelInfoQuery = trpc.youtube.channelInfo.useQuery(
    { channelUrl: channelUrlInput },
    { enabled: false }
  );

  const handleSaveChannelUrl = async () => {
    if (!channelUrlInput.trim() && !channelNameInput.trim()) {
      Alert.alert('エラー', 'URLまたはチャンネル名を入力してください');
      return;
    }

    Keyboard.dismiss();
    setIsFetchingChannel(true);

    try {
      // Use manually entered icon URL if provided
      const iconUrl = channelIconUrlInput.trim();
      const channelId = channelUrlInput.trim() ? (extractChannelId(channelUrlInput) || channelUrlInput.trim()) : 'custom';
      const channelName = channelNameInput.trim() || channelId;

      await saveChannelConfig({
        channelUrl: channelUrlInput.trim() || '',
        channelId: channelId,
        channelName: channelName,
        iconUrl: iconUrl,
      });
    } catch (e) {
      Alert.alert('エラー', '保存に失敗しました。再度お試しください。');
    } finally {
      setIsFetchingChannel(false);
    }

    const updated = await getChannelConfig();
    setChannelConfig(updated);
    setShowChannelModal(false);
    setChannelUrlInput('');
    setChannelIconUrlInput('');
    setChannelNameInput('');
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
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6' }}
                  contentFit="cover"
                />
              )}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F0F0F' }}>
                    {channelConfig?.channelName || 'ViewCore'}
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
      <Modal visible={showChannelModal} transparent animationType="slide" onRequestClose={() => { setShowChannelModal(false); setChannelUrlInput(''); }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
                  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24 }}>
                  {/* Handle bar */}
                  <View style={{ width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F0F0F', marginBottom: 6 }}>チャンネル設定</Text>
                  <Text style={{ fontSize: 13, color: '#606060', marginBottom: 16, lineHeight: 20 }}>
                    チャンネル名とアイコン画像 URL を入力してください。
                  </Text>

                  {/* Current Channel Preview */}
                  {channelConfig?.iconUrl && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                      <Image
                        source={{ uri: channelConfig.iconUrl }}
                        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6' }}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F0F0F' }}>{channelConfig.channelName}</Text>
                        <Text style={{ fontSize: 11, color: '#606060' }} numberOfLines={1}>{channelConfig.channelUrl}</Text>
                      </View>
                    </View>
                  )}

                  {/* Channel Name */}
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#606060', marginBottom: 6 }}>チャンネル名 <Text style={{ color: '#EF4444' }}>*</Text></Text>
                  <TextInput
                    value={channelNameInput}
                    onChangeText={setChannelNameInput}
                    placeholder="例: 三崎優太"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: '#0F0F0F',
                      marginBottom: 14,
                    }}
                    returnKeyType="next"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {/* Icon Image URL */}
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#606060', marginBottom: 6 }}>アイコン画像 URL</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, lineHeight: 16 }}>
                    YouTubeのチャンネルアイコンをブラウザで長押し → 「画像アドレスをコピー」で取得できます。
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    {channelIconUrlInput.trim() ? (
                      <Image
                        source={{ uri: channelIconUrlInput.trim() }}
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>📷</Text>
                      </View>
                    )}
                    <TextInput
                      value={channelIconUrlInput}
                      onChangeText={setChannelIconUrlInput}
                      placeholder="https://yt3.googleusercontent.com/..."
                      placeholderTextColor="#9CA3AF"
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 13,
                        color: '#0F0F0F',
                      }}
                      returnKeyType="next"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Channel URL (optional) */}
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#606060', marginBottom: 6 }}>チャンネルURL（任意）</Text>
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
                    onSubmitEditing={handleSaveChannelUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={false}
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => { setShowChannelModal(false); setChannelUrlInput(''); setChannelIconUrlInput(''); setChannelNameInput(''); Keyboard.dismiss(); }}
                      style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#606060' }}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveChannelUrl}
                      disabled={isFetchingChannel}
                      style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: isFetchingChannel ? '#9CA3AF' : '#FF0000', alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>{isFetchingChannel ? '取得中...' : '保存'}</Text>
                    </TouchableOpacity>
                  </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
