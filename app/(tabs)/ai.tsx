import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { parseVideoData, getChannelSummary, formatNumber, formatRevenue, calculatePerformanceScore } from "@/lib/data/csv-parser";
import { generateChannelInsights } from "@/lib/data/ai-analysis";
import { IconSymbol } from "@/components/ui/icon-symbol";

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

export default function AIScreen() {
  const [activeSection, setActiveSection] = useState<'insights' | 'actions' | 'grades'>('insights');

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

  const SECTIONS = [
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
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F0F0F' }}>AI分析</Text>
              <Text style={{ fontSize: 11, color: '#606060' }}>{videos.length}本の動画を分析</Text>
            </View>
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
                    <View key={grade} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: GRADE_COLORS[grade] + '20', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: GRADE_COLORS[grade] }}>{grade}</Text>
                          </View>
                          <Text style={{ fontSize: 13, color: '#0F0F0F', fontWeight: '600' }}>{count}本</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: '#606060' }}>{pct.toFixed(1)}%</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: `${pct}%` as any, height: 8, backgroundColor: GRADE_COLORS[grade], borderRadius: 4 }} />
                      </View>
                    </View>
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
