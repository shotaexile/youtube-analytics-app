import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useState, useCallback, useEffect, useRef } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useVideos } from "@/lib/data/use-analytics";
import { formatNumber } from "@/lib/data/csv-parser";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeWindow = "1h" | "24h" | "48h" | "1week";
type SortMetric = "views" | "impressions" | "ctr" | "avgViewRate" | "likeRate";

const TIME_WINDOWS: { key: TimeWindow; label: string }[] = [
  { key: "1h", label: "1時間" },
  { key: "24h", label: "24時間" },
  { key: "48h", label: "48時間" },
  { key: "1week", label: "1週間" },
];

const SORT_METRICS: { key: SortMetric; label: string; unit: string }[] = [
  { key: "views", label: "視聴回数", unit: "回" },
  { key: "impressions", label: "インプレ", unit: "" },
  { key: "ctr", label: "CTR", unit: "%" },
  { key: "avgViewRate", label: "平均視聴率", unit: "%" },
  { key: "likeRate", label: "高評価率", unit: "%" },
];

interface EarlyStatRow {
  id: number;
  videoId: string;
  timeWindow: TimeWindow;
  views: number;
  impressions: number;
  ctr: number;
  avgViewRate: number;
  likeRate: number;
  recordedAt: string | Date;
  title: string | null;
  publishedAt: string | null;
  isShort: boolean | null;
  finalViews: number | null;
}

interface InputFormState {
  views: string;
  impressions: string;
  ctr: string;
  avgViewRate: string;
  likeRate: string;
  avgWatchTime?: string; // 削除対象フィールド（24時間のみ）
}

const EMPTY_FORM: InputFormState = {
  views: "",
  impressions: "",
  ctr: "",
  avgViewRate: "",
  likeRate: "",
};

// ── Input Modal ───────────────────────────────────────────────────────────────

function EarlyStatsInputModal({
  visible,
  videoId,
  videoTitle,
  existingStats,
  onClose,
  onSaved,
}: {
  visible: boolean;
  videoId: string;
  videoTitle: string;
  existingStats: { timeWindow: TimeWindow; views: number; impressions: number; ctr: number; avgViewRate: number; likeRate: number }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [activeWindow, setActiveWindow] = useState<TimeWindow>("1h");
  const [forms, setForms] = useState<Record<TimeWindow, InputFormState>>({
    "1h": EMPTY_FORM,
    "24h": EMPTY_FORM,
    "48h": EMPTY_FORM,
    "1week": EMPTY_FORM,
  });
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);

  // Pre-fill existing data when modal opens
  const initForms = useCallback(() => {
    const next: Record<TimeWindow, InputFormState> = {
      "1h": EMPTY_FORM,
      "24h": EMPTY_FORM,
      "48h": EMPTY_FORM,
      "1week": EMPTY_FORM,
    };
    for (const s of existingStats) {
      next[s.timeWindow] = {
        views: s.views > 0 ? String(s.views) : "",
        impressions: s.impressions > 0 ? String(s.impressions) : "",
        ctr: s.ctr > 0 ? String(s.ctr) : "",
        avgViewRate: s.avgViewRate > 0 ? String(s.avgViewRate) : "",
        likeRate: s.likeRate > 0 ? String(s.likeRate) : "",
      };
    }
    setForms(next);
  }, [existingStats]);

  const saveMutation = trpc.analytics.saveEarlyStats.useMutation();

  // オートセーブ機能：フォーム変更後3秒後に自動保存
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current !== null) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      const allWindows: TimeWindow[] = ["1h", "24h", "48h", "1week"];
      for (const window of allWindows) {
        const form = forms[window];
        const views = parseInt(form.views) || 0;
        const impressions = parseInt(form.impressions) || 0;
        const ctr = parseFloat(form.ctr) || 0;
        const avgViewRate = parseFloat(form.avgViewRate) || 0;
        const likeRate = parseFloat(form.likeRate) || 0;

        if (views > 0 || impressions > 0) {
          try {
            await saveMutation.mutateAsync({
              videoId,
              timeWindow: window,
              views,
              impressions,
              ctr,
              avgViewRate,
              likeRate,
            });
          } catch (e) {
            console.error(`Failed to autosave ${window}:`, e);
          }
        }
      }
      setIsSaving(false);
      onSaved();
    }, 3000);
  }, [forms, videoId, saveMutation, onSaved]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current !== null) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const updateField = (window: TimeWindow, field: keyof InputFormState, value: string) => {
    setForms(prev => ({ ...prev, [window]: { ...prev[window], [field]: value } }));
    setIsSaving(true);
    triggerAutoSave();
  };

  const currentForm = forms[activeWindow];
  const hasExisting = existingStats.some(s => s.timeWindow === activeWindow);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={initForms}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 20, borderBottomWidth: 0.5, borderBottomColor: colors.border }}
        >
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <IconSymbol name="xmark" size={20} color={colors.muted} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1, textAlign: "center", marginHorizontal: 8 }} numberOfLines={1}>
            初速データ入力
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isSaving && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>
              {isSaving ? "保存中..." : "自動保存"}
            </Text>
          </View>
        </View>

        {/* Video title */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.surface }}>
          <Text style={{ fontSize: 13, color: colors.muted }} numberOfLines={2}>{videoTitle}</Text>
        </View>

        {/* Time window selector - 横並びで固定幅 */}
        <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingHorizontal: 12, paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", gap: 6, justifyContent: "space-between" }}>
            {TIME_WINDOWS.map(tw => {
              const isActive = activeWindow === tw.key;
              const hasData = existingStats.some(s => s.timeWindow === tw.key);
              return (
                <TouchableOpacity
                  key={tw.key}
                  onPress={() => setActiveWindow(tw.key)}
                  style={{
                    flex: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: isActive ? "#FF0000" : colors.surface,
                    borderWidth: hasData && !isActive ? 1.5 : 0,
                    borderColor: "#22C55E",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? "#fff" : hasData ? "#22C55E" : colors.muted }} numberOfLines={1}>
                    {tw.label}{hasData && !isActive ? " ✓" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
          {hasExisting && (
            <View style={{ backgroundColor: colors.success + "20", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.success }}>
              <Text style={{ fontSize: 12, color: colors.success }}>✓ このタイムウィンドウのデータは保存済みです。上書きされます。</Text>
            </View>
          )}

          <InputField
            label="視聴回数"
            value={currentForm.views}
            onChangeText={v => updateField(activeWindow, "views", v)}
            placeholder="例: 15000"
            keyboardType="numeric"
            icon="eye.fill"
            iconColor="#3B82F6"
          />
          <InputField
            label="インプレッション数"
            value={currentForm.impressions}
            onChangeText={v => updateField(activeWindow, "impressions", v)}
            placeholder="例: 50000"
            keyboardType="numeric"
            icon="arrow.up.right"
            iconColor="#8B5CF6"
          />
          <InputField
            label="クリック率 (CTR) %"
            value={currentForm.ctr}
            onChangeText={v => updateField(activeWindow, "ctr", v)}
            placeholder="例: 8.5"
            keyboardType="decimal-pad"
            icon="magnifyingglass"
            iconColor="#F59E0B"
            hint="YouTube Studioに表示されている%の数値をそのまま入力"
          />
          {/* 1時間の場合は平均視聴率を非表示 */}
          {activeWindow !== "1h" && (
            <InputField
              label="平均視聴率 %"
              value={currentForm.avgViewRate}
              onChangeText={v => updateField(activeWindow, "avgViewRate", v)}
              placeholder="例: 42.3"
              keyboardType="decimal-pad"
              icon="chart.line.uptrend.xyaxis"
              iconColor="#22C55E"
              hint="YouTube Studioに表示されている%の数値をそのまま入力"
              colors={colors}
            />
          )}
          <InputField
            label="高評価率 %"
            value={currentForm.likeRate}
            onChangeText={v => updateField(activeWindow, "likeRate", v)}
            placeholder="例: 96.2"
            keyboardType="decimal-pad"
            icon="hand.thumbsup.fill"
            iconColor="#EF4444"
            hint="高評価 ÷ (高評価 + 低評価) × 100"
            colors={colors}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  icon,
  iconColor,
  hint,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "numeric" | "decimal-pad";
  icon: any;
  iconColor: string;
  hint?: string;
  colors?: any;
}) {
  const colorScheme = useColorScheme();
  const themeColors = colors || Colors[colorScheme];

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <IconSymbol name={icon} size={14} color={iconColor} />
        <Text style={{ fontSize: 13, fontWeight: "600", color: themeColors.foreground }}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType ?? "numeric"}
        returnKeyType="done"
        style={{
          borderWidth: 1,
          borderColor: themeColors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: themeColors.foreground,
          backgroundColor: themeColors.surface,
        }}
        placeholderTextColor={themeColors.muted}
      />
      {hint && <Text style={{ fontSize: 11, color: themeColors.muted }}>{hint}</Text>}
    </View>
  );
}

// ── Ranking Row ───────────────────────────────────────────────────────────────

function RankingRow({ item, rank, sortMetric }: { item: EarlyStatRow; rank: number; sortMetric: SortMetric }) {
  const thumbnailUrl = `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;
  const metricInfo = SORT_METRICS.find(m => m.key === sortMetric)!;

  const getValue = () => {
    switch (sortMetric) {
      case "views": return formatNumber(item.views);
      case "impressions": return formatNumber(item.impressions);
      case "ctr": return `${item.ctr.toFixed(1)}%`;
      case "avgViewRate": return `${item.avgViewRate.toFixed(1)}%`;
      case "likeRate": return `${item.likeRate.toFixed(1)}%`;
    }
  };

  const rankColor = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : "#9CA3AF";

  // Velocity ratio: early views / final views
  const velocityRatio = item.finalViews && item.finalViews > 0
    ? ((item.views / item.finalViews) * 100).toFixed(1)
    : null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6" }}>
      {/* Rank */}
      <View style={{ width: 28, alignItems: "center" }}>
        <Text style={{ fontSize: rank <= 3 ? 16 : 13, fontWeight: "800", color: rankColor }}>{rank}</Text>
      </View>

      {/* Thumbnail */}
      <Image
        source={{ uri: thumbnailUrl }}
        style={{ width: 64, height: 36, borderRadius: 6, marginHorizontal: 8, backgroundColor: "#F3F4F6" }}
        contentFit="cover"
      />

      {/* Title & meta */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#0F0F0F", lineHeight: 16 }} numberOfLines={2}>
          {item.title ?? item.videoId}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {item.isShort && (
            <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: "#3B82F6", fontWeight: "700" }}>SHORT</Text>
            </View>
          )}
          {velocityRatio && (
            <Text style={{ fontSize: 10, color: "#9CA3AF" }}>最終比 {velocityRatio}%</Text>
          )}
          {item.publishedAt && (
            <Text style={{ fontSize: 10, color: "#9CA3AF" }}>{item.publishedAt}</Text>
          )}
        </View>
      </View>

      {/* Metric value */}
      <View style={{ alignItems: "flex-end", minWidth: 60 }}>
        <Text style={{ fontSize: 15, fontWeight: "800", color: "#0F0F0F" }}>{getValue()}</Text>
        <Text style={{ fontSize: 10, color: "#9CA3AF" }}>{metricInfo.label}</Text>
      </View>
    </View>
  );
}

// ── Video Picker Row ──────────────────────────────────────────────────────────

function VideoPickerRow({
  videoId,
  title,
  publishedAt,
  isShort,
  hasData,
  onPress,
}: {
  videoId: string;
  title: string;
  publishedAt: string;
  isShort: boolean;
  hasData: boolean;
  onPress: () => void;
}) {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6" }}
    >
      <Image
        source={{ uri: thumbnailUrl }}
        style={{ width: 64, height: 36, borderRadius: 6, backgroundColor: "#F3F4F6" }}
        contentFit="cover"
      />
      <View style={{ flex: 1, marginLeft: 10, gap: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#0F0F0F" }} numberOfLines={2}>{title}</Text>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {isShort && (
            <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: "#3B82F6", fontWeight: "700" }}>SHORT</Text>
            </View>
          )}
          <Text style={{ fontSize: 10, color: "#9CA3AF" }}>{publishedAt}</Text>
          {hasData && (
            <View style={{ backgroundColor: "#F0FDF4", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: "#22C55E", fontWeight: "700" }}>データあり</Text>
            </View>
          )}
        </View>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function EarlyStatsScreen() {
  const [activeTab, setActiveTab] = useState<"ranking" | "input">("ranking");
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<TimeWindow>("24h");
  const [selectedSortMetric, setSelectedSortMetric] = useState<SortMetric>("views");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);

  const { videos: allVideos } = useVideos("all");

  // Fetch ranking data
  const rankingQuery = trpc.analytics.getAllEarlyStats.useQuery(
    { timeWindow: selectedTimeWindow, sortBy: selectedSortMetric, limit: 100 },
    { staleTime: 10_000 }
  );

  // Fetch early stats for selected video (for modal pre-fill)
  const videoEarlyStatsQuery = trpc.analytics.getEarlyStats.useQuery(
    { videoId: selectedVideo?.id ?? "" },
    { enabled: !!selectedVideo?.id, staleTime: 5_000 }
  );

  // Videos that have early stats (for "データあり" badge)
  const videosWithData = new Set((rankingQuery.data ?? []).map(r => r.videoId));

  const handleVideoPress = (videoId: string, title: string) => {
    setSelectedVideo({ id: videoId, title });
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedVideo(null);
  };

  const handleSaved = () => {
    rankingQuery.refetch();
    videoEarlyStatsQuery.refetch();
  };

  // Sort ranking data by selected metric
  const sortedRanking = [...(rankingQuery.data ?? [])].sort((a, b) => {
    const va = a[selectedSortMetric] ?? 0;
    const vb = b[selectedSortMetric] ?? 0;
    return (vb as number) - (va as number);
  });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0F0F0F" }}>初速データ</Text>
        <Text style={{ fontSize: 13, color: "#606060", marginTop: 2 }}>投稿直後のパフォーマンスを記録・分析</Text>
      </View>

      {/* Tab switcher */}
      <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 12, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 3 }}>
        <TouchableOpacity
          onPress={() => setActiveTab("ranking")}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: activeTab === "ranking" ? "#fff" : "transparent", alignItems: "center" }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: activeTab === "ranking" ? "#0F0F0F" : "#9CA3AF" }}>ランキング</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("input")}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: activeTab === "input" ? "#fff" : "transparent", alignItems: "center" }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: activeTab === "input" ? "#0F0F0F" : "#9CA3AF" }}>データ入力</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "ranking" ? (
        <>
          {/* Time window filter - 横並び均等配置 */}
          <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 8, gap: 6 }}>
            {TIME_WINDOWS.map(tw => (
              <TouchableOpacity
                key={tw.key}
                onPress={() => setSelectedTimeWindow(tw.key)}
                style={{
                  flex: 1,
                  paddingHorizontal: 4,
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: selectedTimeWindow === tw.key ? "#FF0000" : "#F3F4F6",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: selectedTimeWindow === tw.key ? "#fff" : "#606060" }} numberOfLines={1}>
                  {tw.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort metric filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 6 }}>
              {SORT_METRICS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setSelectedSortMetric(m.key)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 16,
                    backgroundColor: selectedSortMetric === m.key ? "#0F0F0F" : "#F3F4F6",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: selectedSortMetric === m.key ? "#fff" : "#606060" }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Ranking list */}
          {rankingQuery.isLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color="#FF0000" />
            </View>
          ) : sortedRanking.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <IconSymbol name="clock.fill" size={48} color="#E5E7EB" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#9CA3AF", marginTop: 12, textAlign: "center" }}>
                まだデータがありません
              </Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6, textAlign: "center" }}>
                「データ入力」タブから動画を選んで{"\n"}初速データを記録してください
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedRanking}
              keyExtractor={item => `${item.videoId}-${item.timeWindow}`}
              renderItem={({ item, index }) => (
                <RankingRow item={item as EarlyStatRow} rank={index + 1} sortMetric={selectedSortMetric} />
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        /* Input tab: video picker */
        <FlatList
          data={allVideos.slice(0, 200)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <VideoPickerRow
              videoId={item.id}
              title={item.title}
              publishedAt={item.publishedAt}
              isShort={item.isShort}
              hasData={videosWithData.has(item.id)}
              onPress={() => handleVideoPress(item.id, item.title)}
            />
          )}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FFF7ED", borderBottomWidth: 0.5, borderBottomColor: "#FED7AA" }}>
              <Text style={{ fontSize: 12, color: "#92400E" }}>
                📋 動画を選んで初速データを入力してください。投稿後1時間・24時間・48時間・1週間のデータを記録できます。
              </Text>
            </View>
          }
        />
      )}

      {/* Input Modal */}
      {selectedVideo && (
        <EarlyStatsInputModal
          visible={modalVisible}
          videoId={selectedVideo.id}
          videoTitle={selectedVideo.title}
          existingStats={(videoEarlyStatsQuery.data ?? []) as any}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </ScreenContainer>
  );
}
