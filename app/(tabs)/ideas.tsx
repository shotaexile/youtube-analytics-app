import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  title: string;
  summary: string;
  category: string;
  impact: "high" | "medium" | "low";
}

interface ToolItem {
  rank: number;
  toolName: string;
  description: string;
  bestFor: string;
  url?: string;
}

interface RankingCategory {
  category: string;
  tools: ToolItem[];
}

interface VideoTool {
  toolName: string;
  category: string;
  description: string;
  useCases: string[];
  tips: string;
  url?: string;
  pricing: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ImpactBadge({ impact }: { impact: string }) {
  const colors = useColors();
  const colorMap: Record<string, string> = {
    high: colors.error,
    medium: colors.warning,
    low: colors.success,
  };
  const labelMap: Record<string, string> = {
    high: "重要",
    medium: "注目",
    low: "参考",
  };
  const bg = colorMap[impact] ?? colors.muted;
  return (
    <View style={[styles.badge, { backgroundColor: bg + "22", borderColor: bg, borderWidth: 1 }]}>
      <Text style={[styles.badgeText, { color: bg }]}>{labelMap[impact] ?? impact}</Text>
    </View>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryTag, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
        </View>
        <ImpactBadge impact={item.impact} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[styles.cardBody, { color: colors.muted }]}>{item.summary}</Text>
    </View>
  );
}

function RankingCard({ category }: { category: RankingCategory }) {
  const colors = useColors();
  const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.primary }]}>{category.category}</Text>
      {(category.tools ?? []).slice(0, 3).map((tool, i) => (
        <View
          key={tool.toolName}
          style={[
            styles.rankRow,
            i < Math.min((category.tools?.length ?? 0) - 1, 2) && {
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={[styles.rankBadge, { backgroundColor: rankColors[i] ?? colors.muted }]}>
            <Text style={styles.rankNum}>{tool.rank ?? i + 1}</Text>
          </View>
          <View style={styles.rankInfo}>
            <Text style={[styles.toolName, { color: colors.foreground }]}>{tool.toolName}</Text>
            <Text style={[styles.toolDesc, { color: colors.muted }]}>{tool.description}</Text>
            <Text style={[styles.toolBest, { color: colors.primary }]}>✓ {tool.bestFor}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function VideoToolCard({ tool }: { tool: VideoTool }) {
  const colors = useColors();
  const pricingColor =
    tool.pricing === "無料"
      ? colors.success
      : tool.pricing === "フリーミアム"
      ? colors.warning
      : colors.muted;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryTag, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{tool.category}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: pricingColor + "22", borderColor: pricingColor, borderWidth: 1 },
          ]}
        >
          <Text style={[styles.badgeText, { color: pricingColor }]}>{tool.pricing}</Text>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{tool.toolName}</Text>
      <Text style={[styles.cardBody, { color: colors.muted }]}>{tool.description}</Text>
      <View style={styles.useCaseList}>
        {(tool.useCases ?? []).map((uc, i) => (
          <Text key={i} style={[styles.useCaseItem, { color: colors.foreground }]}>
            • {uc}
          </Text>
        ))}
      </View>
      {tool.tips ? (
        <View
          style={[
            styles.tipBox,
            { backgroundColor: colors.primary + "11", borderLeftColor: colors.primary },
          ]}
        >
          <Text style={[styles.tipText, { color: colors.foreground }]}>💡 {tool.tips}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Tab = "news" | "rankings" | "video";

export default function IdeasScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: report,
    isLoading,
    refetch,
  } = trpc.aiInfo.getLatestReport.useQuery(undefined, {
    staleTime: 1000 * 60 * 30,
  });

  const generateMutation = trpc.aiInfo.generateReport.useMutation({
    onSuccess: () => refetch(),
    onSettled: () => setRefreshing(false),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await generateMutation.mutateAsync();
  };

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: "news", label: "最新ニュース", emoji: "📰" },
    { key: "rankings", label: "ツール比較", emoji: "🏆" },
    { key: "video", label: "動画AI", emoji: "🎬" },
  ];

  const latestNews: NewsItem[] = (report?.latestNews as NewsItem[]) ?? [];
  const toolRankings: RankingCategory[] = (report?.toolRankings as RankingCategory[]) ?? [];
  const videoAiTools: VideoTool[] = (report?.videoAiTools as VideoTool[]) ?? [];

  const reportDateStr = report?.reportDate
    ? typeof report.reportDate === "string"
      ? report.reportDate
      : new Date(report.reportDate as Date).toLocaleDateString("ja-JP")
    : null;

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            AI情報ダッシュボード
          </Text>
          {reportDateStr ? (
            <Text style={[styles.headerSub, { color: colors.muted }]}>
              最終更新: {reportDateStr}
            </Text>
          ) : (
            <Text style={[styles.headerSub, { color: colors.muted }]}>毎朝7時に自動更新</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
          disabled={generateMutation.isPending || refreshing}
        >
          {generateMutation.isPending || refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.refreshBtnText}>更新</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.tabItem,
              activeTab === t.key && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === t.key ? colors.primary : colors.muted },
              ]}
            >
              {t.emoji} {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>読み込み中...</Text>
        </View>
      ) : !report ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🤖</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            まだデータがありません
          </Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            「今すぐ生成する」を押すと、AIが最新情報を収集します。{"\n"}毎朝7時に自動更新されます。
          </Text>
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.generateBtnText}>今すぐ生成する</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {activeTab === "news" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                AI最新ニュース
              </Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                ChatGPT・Gemini・Claude・動画AIなど最新動向
              </Text>
              {latestNews.length === 0 ? (
                <Text
                  style={[
                    styles.emptyBody,
                    { color: colors.muted, textAlign: "center", marginTop: 24 },
                  ]}
                >
                  ニュースデータがありません
                </Text>
              ) : (
                latestNews.map((item, i) => <NewsCard key={i} item={item} />)
              )}
            </>
          )}

          {activeTab === "rankings" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                AIツール得意分野ランキング
              </Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                リサーチ・画像生成・スライド作成など用途別に最強ツールを一目で確認
              </Text>
              {toolRankings.length === 0 ? (
                <Text
                  style={[
                    styles.emptyBody,
                    { color: colors.muted, textAlign: "center", marginTop: 24 },
                  ]}
                >
                  ランキングデータがありません
                </Text>
              ) : (
                toolRankings.map((cat, i) => <RankingCard key={i} category={cat} />)
              )}
            </>
          )}

          {activeTab === "video" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                動画制作AIツール活用事例
              </Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                Kling・DomoAI・Veo3・Runwayなど動画編集に使えるAIツールの最新情報
              </Text>
              {videoAiTools.length === 0 ? (
                <Text
                  style={[
                    styles.emptyBody,
                    { color: colors.muted, textAlign: "center", marginTop: 24 },
                  ]}
                >
                  動画AIツールデータがありません
                </Text>
              ) : (
                videoAiTools.map((tool, i) => <VideoToolCard key={i} tool={tool} />)
              )}
            </>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  refreshBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 10,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNum: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  rankInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 2,
  },
  toolBest: {
    fontSize: 11,
    fontWeight: "600",
  },
  useCaseList: {
    marginTop: 8,
    gap: 3,
  },
  useCaseItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  tipBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  generateBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 160,
    alignItems: "center",
  },
  generateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
