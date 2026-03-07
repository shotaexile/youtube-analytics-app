import { ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, getChannelSummary, formatNumber, formatRevenue, calculatePerformanceScore } from "@/lib/data/csv-parser";
import { generateChannelInsights } from "@/lib/data/ai-analysis";
import { IconSymbol } from "@/components/ui/icon-symbol";

const AUTH_STORAGE_KEY = "viewcore_auth_v2";

const GRADE_COLORS: Record<string, string> = {
  S: '#FF0000',
  A: '#F59E0B',
  B: '#22C55E',
  C: '#3B82F6',
  D: '#9CA3AF',
};

function InsightCard({ title, content, icon, color }: { title: string; content: string; icon: any; color: string }) {
  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
          <IconSymbol name={icon} size={18} color={color} />
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', flex: 1 }}>{title}</Text>
      </View>
      <Text style={{ fontSize: 13, color: '#444', lineHeight: 20 }}>{content}</Text>
    </View>
  );
}

function ActionItem({ action, index }: { action: string; index: number }) {
  const colors = ['#FF0000', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6'];
  const color = colors[index % colors.length];
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, backgroundColor: 'white', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <Text style={{ fontSize: 13, color: 'white', fontWeight: '800' }}>{index + 1}</Text>
      </View>
      <Text style={{ fontSize: 13, color: '#0F0F0F', flex: 1, lineHeight: 20 }}>{action}</Text>
    </View>
  );
}

function ChannelSummaryCard({ videos, summary }: { videos: any[]; summary: any }) {
  const shorts = videos.filter(v => v.isShort && !v.isPrivate);
  const regulars = videos.filter(v => !v.isShort && !v.isPrivate);
  const avgShortViews = shorts.length > 0 ? shorts.reduce((s: number, v: any) => s + v.views, 0) / shorts.length : 0;
  const avgRegularViews = regulars.length > 0 ? regulars.reduce((s: number, v: any) => s + v.views, 0) / regulars.length : 0;
  const avgShortCtr = shorts.length > 0 ? shorts.reduce((s: number, v: any) => s + v.ctr, 0) / shorts.length : 0;
  const avgRegularCtr = regulars.length > 0 ? regulars.reduce((s: number, v: any) => s + v.ctr, 0) / regulars.length : 0;
  const avgShortLike = shorts.length > 0 ? shorts.reduce((s: number, v: any) => s + v.likeRate, 0) / shorts.length : 0;
  const avgRegularLike = regulars.length > 0 ? regulars.reduce((s: number, v: any) => s + v.likeRate, 0) / regulars.length : 0;

  const ctrDiff = avgShortCtr > 0 && avgRegularCtr > 0 ? (avgShortCtr / avgRegularCtr) : 0;
  const viewsDiff = avgShortViews > 0 && avgRegularViews > 0 ? (avgShortViews / avgRegularViews) : 0;

  const comparisons: { label: string; short: string; regular: string; winner: string; icon: any; color: string }[] = [
    {
      label: '平均視聴回数',
      short: formatNumber(Math.round(avgShortViews)),
      regular: formatNumber(Math.round(avgRegularViews)),
      winner: avgShortViews > avgRegularViews ? 'short' : 'regular',
      icon: 'eye.fill' as any,
      color: '#FF0000',
    },
    {
      label: 'CTR（クリック率）',
      short: `${avgShortCtr.toFixed(1)}%`,
      regular: `${avgRegularCtr.toFixed(1)}%`,
      winner: avgShortCtr > avgRegularCtr ? 'short' : 'regular',
      icon: 'arrow.up.right' as any,
      color: '#8B5CF6',
    },
    {
      label: '高評価率',
      short: `${avgShortLike.toFixed(1)}%`,
      regular: `${avgRegularLike.toFixed(1)}%`,
      winner: avgShortLike > avgRegularLike ? 'short' : 'regular',
      icon: 'hand.thumbsup.fill' as any,
      color: '#EC4899',
    },
  ];

  // Key trends
  const trends: { icon: any; color: string; text: string }[] = [];
  if (ctrDiff > 1.5) {
    trends.push({ icon: 'arrow.up.right' as any, color: '#3B82F6', text: `ショートのCTRは一般動画の${ctrDiff.toFixed(1)}倍高い` });
  } else if (ctrDiff > 0 && ctrDiff < 0.8) {
    trends.push({ icon: 'arrow.up.right' as any, color: '#FF0000', text: `一般動画のCTRはショートの${(1/ctrDiff).toFixed(1)}倍高い` });
  }
  if (viewsDiff > 2) {
    trends.push({ icon: 'eye.fill' as any, color: '#3B82F6', text: `ショートの平均視聴回数は一般動画の${viewsDiff.toFixed(1)}倍` });
  } else if (viewsDiff > 0 && viewsDiff < 0.5) {
    trends.push({ icon: 'eye.fill' as any, color: '#FF0000', text: `一般動画の平均視聴回数はショートの${(1/viewsDiff).toFixed(1)}倍` });
  }

  const topVideo = [...videos].filter(v => !v.isPrivate).sort((a: any, b: any) => b.views - a.views)[0];
  const recentVideos = [...videos].filter(v => !v.isPrivate).sort((a: any, b: any) => b.publishedDate.getTime() - a.publishedDate.getTime()).slice(0, 10);
  const recentAvgViews = recentVideos.length > 0 ? recentVideos.reduce((s: number, v: any) => s + v.views, 0) / recentVideos.length : 0;
  const allAvgViews = videos.filter(v => !v.isPrivate).reduce((s: number, v: any) => s + v.views, 0) / Math.max(1, videos.filter(v => !v.isPrivate).length);
  const recentTrend = recentAvgViews > allAvgViews ? 'up' : 'down';
  const recentTrendPct = allAvgViews > 0 ? Math.abs(((recentAvgViews - allAvgViews) / allAvgViews) * 100) : 0;

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' }}>
          <IconSymbol name="chart.bar.fill" size={17} color="#FF0000" />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F0F0F' }}>チャンネル全体の傾向</Text>
      </View>

      {/* Short vs Regular comparison */}
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#606060', marginBottom: 10 }}>ショート vs 一般動画</Text>
      <View style={{ marginBottom: 14 }}>
        {/* Column headers */}
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <View style={{ flex: 1.5 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#3B82F6' }}>ショート</Text>
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FFF0F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF0000' }}>一般動画</Text>
            </View>
          </View>
        </View>
        {comparisons.map((c, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: i > 0 ? 0.5 : 0, borderTopColor: '#F3F4F6' }}>
            <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <IconSymbol name={c.icon} size={13} color={c.color} />
              <Text style={{ fontSize: 12, color: '#374151' }}>{c.label}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.winner === 'short' ? '#3B82F6' : '#9CA3AF' }}>
                {c.short}
                {c.winner === 'short' && <Text style={{ fontSize: 10 }}> ✓</Text>}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.winner === 'regular' ? '#FF0000' : '#9CA3AF' }}>
                {c.regular}
                {c.winner === 'regular' && <Text style={{ fontSize: 10 }}> ✓</Text>}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Key trends */}
      {trends.length > 0 && (
        <View style={{ backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#606060', marginBottom: 8 }}>注目トレンド</Text>
          {trends.map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: i < trends.length - 1 ? 6 : 0 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name={t.icon} size={11} color={t.color} />
              </View>
              <Text style={{ fontSize: 12, color: '#374151', flex: 1, lineHeight: 18 }}>{t.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent performance */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: recentTrend === 'up' ? '#F0FDF4' : '#FFF1F2', borderRadius: 12, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <IconSymbol name={recentTrend === 'up' ? 'arrow.up.right' : 'arrow.down.right'} size={13} color={recentTrend === 'up' ? '#22C55E' : '#EF4444'} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: recentTrend === 'up' ? '#22C55E' : '#EF4444' }}>直近10本の傾向</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: recentTrend === 'up' ? '#22C55E' : '#EF4444' }}>
            {recentTrend === 'up' ? '+' : '-'}{recentTrendPct.toFixed(0)}%
          </Text>
          <Text style={{ fontSize: 10, color: '#606060', marginTop: 2 }}>チャンネル平均比</Text>
        </View>
        {topVideo && (
          <View style={{ flex: 1, backgroundColor: '#FFF0F0', borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <IconSymbol name="trophy.fill" size={13} color="#FF0000" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF0000' }}>最高視聴回数</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#FF0000' }}>{formatNumber(topVideo.views)}</Text>
            <Text style={{ fontSize: 10, color: '#606060', marginTop: 2 }} numberOfLines={1}>{topVideo.title}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AIScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'summary' | 'insights' | 'actions' | 'grades'>('summary');

  const videos = useMemo(() => parseVideoData(), []);
  const summary = useMemo(() => getChannelSummary(), []);
  const insights = useMemo(() => generateChannelInsights(videos, summary), [videos, summary]);

  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    for (const v of videos) {
      const { grade } = calculatePerformanceScore(v);
      dist[grade]++;
    }
    return dist;
  }, [videos]);

  const topSVideos = useMemo(() =>
    videos.filter(v => calculatePerformanceScore(v).grade === 'S').slice(0, 5),
    [videos]
  );

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      '本当にログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          onPress: async () => {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            router.replace('/' as any);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const SECTIONS = [
    { key: 'summary' as const, label: 'サマリー', icon: 'chart.bar.fill' as any },
    { key: 'insights' as const, label: 'インサイト', icon: 'brain.head.profile' as any },
    { key: 'actions' as const, label: 'アクション', icon: 'arrow.up.right' as any },
    { key: 'grades' as const, label: '評価分布', icon: 'star.fill' as any },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FF000015', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <IconSymbol name="brain.head.profile" size={20} color="#FF0000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F0F0F' }}>AI分析</Text>
              <Text style={{ fontSize: 11, color: '#606060' }}>{videos.length}本の動画を分析</Text>
            </View>
            {/* Logout button */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#FFF1F2',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
              }}
            >
              <IconSymbol name="power" size={14} color="#EF4444" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>ログアウト</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {SECTIONS.map(s => (
              <TouchableOpacity
                key={s.key}
                onPress={() => setActiveSection(s.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: activeSection === s.key ? '#FF0000' : '#F3F4F6',
                }}
              >
                <IconSymbol name={s.icon} size={14} color={activeSection === s.key ? 'white' : '#606060'} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: activeSection === s.key ? 'white' : '#606060' }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ padding: 16 }}>
          {activeSection === 'summary' && (
            <>
              <ChannelSummaryCard videos={videos} summary={summary} />

              {/* Quick stats */}
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 14 }}>チャンネル概要</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {([
                    { label: '総視聴回数', value: formatNumber(summary.totalViews), color: '#FF0000', icon: 'eye.fill' as any },
                    { label: '総収益', value: formatRevenue(summary.totalRevenue), color: '#22C55E', icon: 'dollarsign.circle.fill' as any },
                    { label: '平均CTR', value: `${summary.avgCtr.toFixed(1)}%`, color: '#8B5CF6', icon: 'arrow.up.right' as any },
                    { label: '平均視聴率', value: `${summary.avgViewRate.toFixed(1)}%`, color: '#06B6D4', icon: 'chart.bar.fill' as any },
                    { label: '登録者増減', value: summary.totalSubscriberChange >= 0 ? `+${formatNumber(summary.totalSubscriberChange)}` : formatNumber(summary.totalSubscriberChange), color: '#F59E0B', icon: 'person.badge.plus' as any },
                    { label: '高評価率', value: `${summary.avgLikeRate.toFixed(1)}%`, color: '#EC4899', icon: 'hand.thumbsup.fill' as any },
                  ] as { label: string; value: string; color: string; icon: any }[]).map((stat, i) => (
                    <View key={i} style={{ width: '47%', backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <IconSymbol name={stat.icon} size={13} color={stat.color} />
                        <Text style={{ fontSize: 11, color: '#606060' }}>{stat.label}</Text>
                      </View>
                      <Text style={{ fontSize: 17, fontWeight: '800', color: stat.color }}>{stat.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {activeSection === 'insights' && (
            <>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 12 }}>チャンネル健全性スコア</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#FF0000' }}>{insights.healthScore}</Text>
                    <Text style={{ fontSize: 11, color: '#606060' }}>総合スコア</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: '#E5E5E5' }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#22C55E' }}>{insights.growthTrend}</Text>
                    <Text style={{ fontSize: 11, color: '#606060' }}>成長トレンド</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: '#E5E5E5' }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#F59E0B' }}>{insights.consistencyScore}</Text>
                    <Text style={{ fontSize: 11, color: '#606060' }}>一貫性</Text>
                  </View>
                </View>
              </View>
              {insights.cards.map((card, i) => (
                <InsightCard key={i} title={card.title} content={card.content} icon={card.icon} color={card.color} />
              ))}
            </>
          )}

          {activeSection === 'actions' && (
            <>
              <View style={{ backgroundColor: '#FFF5F5', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF0000', marginBottom: 6 }}>優先改善アクション</Text>
                <Text style={{ fontSize: 12, color: '#606060', lineHeight: 18 }}>
                  データ分析に基づいた、チャンネル成長のための具体的なアクションプランです。優先度の高い順に並んでいます。
                </Text>
              </View>
              {insights.priorityActions.map((action, i) => (
                <ActionItem key={i} action={action} index={i} />
              ))}
            </>
          )}

          {activeSection === 'grades' && (
            <>
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 16 }}>動画評価分布</Text>
                {Object.entries(gradeDistribution).map(([grade, count]) => {
                  const pct = (count / videos.length) * 100;
                  return (
                    <TouchableOpacity
                      key={grade}
                      onPress={() => router.push({ pathname: '/grade-videos' as any, params: { grade } })}
                      style={{ marginBottom: 14 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: GRADE_COLORS[grade] + '20', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 15, fontWeight: '900', color: GRADE_COLORS[grade] }}>{grade}</Text>
                          </View>
                          <View>
                            <Text style={{ fontSize: 13, color: '#0F0F0F', fontWeight: '700' }}>{count}本</Text>
                            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>タップして一覧を見る</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: GRADE_COLORS[grade] }}>{pct.toFixed(1)}%</Text>
                          <IconSymbol name="chevron.right" size={14} color="#C0C0C0" />
                        </View>
                      </View>
                      <View style={{ height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' }}>
                        <View style={{ width: `${pct}%` as any, height: 10, backgroundColor: GRADE_COLORS[grade], borderRadius: 5 }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {topSVideos.length > 0 && (
                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F' }}>Sランク動画</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FF000015', borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: '#FF0000', fontWeight: '700' }}>最高評価</Text>
                    </View>
                  </View>
                  {topSVideos.map((video, i) => {
                    const { score } = calculatePerformanceScore(video);
                    return (
                      <View key={video.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottomWidth: i < topSVideos.length - 1 ? 0.5 : 0, borderBottomColor: '#F3F4F6' }}>
                        <Text style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F0F0F', marginBottom: 2 }} numberOfLines={2}>{video.title}</Text>
                          <Text style={{ fontSize: 11, color: '#606060' }}>視聴 {formatNumber(video.views)} · {formatRevenue(video.estimatedRevenue)}</Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#FF0000' }}>{score}pt</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
