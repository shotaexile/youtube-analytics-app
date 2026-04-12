import { View,
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
  Dimensions,
} from "react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { Image } from "expo-image";
import { useState, useCallback, useEffect, useRef, useContext } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useVideos } from "@/lib/data/use-analytics";
import { formatNumber } from "@/lib/data/csv-parser";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeWindow = "1h" | "24h" | "48h" | "1week";
type SortMetric = "views" | "impressions" | "ctr" | "avgWatchTimeSec" | "likeRate";

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
  { key: "avgWatchTimeSec", label: "平均視聴率", unit: "%" },
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
  avgWatchTimeSec: number;
  likeRate: number;
  recordedAt: string | Date;
  title: string | null;
  publishedAt: string | null;
  isShort: boolean | null;
  finalViews: number | null;
  duration: number | null;
}

interface InputFormState {
  views: string;
  impressions: string;
  ctr: string;
  avgWatchTimeSec: string;
  likeRate: string;
}

const EMPTY_FORM: InputFormState = {
  views: "",
  impressions: "",
  ctr: "",
  avgWatchTimeSec: "",
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
  existingStats: { timeWindow: TimeWindow; views: number; impressions: number; ctr: number; avgViewRate: number; avgWatchTimeSec: number; likeRate: number }[];
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
        avgWatchTimeSec: (s.avgWatchTimeSec ?? 0) > 0 ? secToMinSec(s.avgWatchTimeSec) : "",
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
        const avgWatchTimeSec = parseMinSec(form.avgWatchTimeSec);
        const likeRate = parseFloat(form.likeRate) || 0;

        if (views > 0 || impressions > 0) {
          try {
            await saveMutation.mutateAsync({
              videoId,
              timeWindow: window,
              views,
              impressions,
              ctr,
              avgViewRate: 0,
              avgWatchTimeSec,
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

// 「分:秒」形式（例: 3:05）を秒数に変換
function parseMinSec(val: string): number {
  if (!val.trim()) return 0;
  if (val.includes(":")) {
    const parts = val.split(":");
    const min = parseInt(parts[0]) || 0;
    const sec = parseInt(parts[1]) || 0;
    return min * 60 + sec;
  }
  return parseInt(val) || 0;
}

// 秒数を「分:秒」形式に変換
function secToMinSec(sec: number): string {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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
          <InputField
            label="平均視聴時間（分:秒）"
            value={currentForm.avgWatchTimeSec}
            onChangeText={v => updateField(activeWindow, "avgWatchTimeSec", v)}
            placeholder="例: 3:05"
            keyboardType="default"
            icon="clock.fill"
            iconColor="#22C55E"
            hint="YouTube Studioの平均視聴時間を「分:秒」形式で入力（例: 3分5秒 → 3:05）"
            colors={colors}
          />
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
  keyboardType?: "numeric" | "decimal-pad" | "default";
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
      case "avgWatchTimeSec": {
        const sec = item.avgWatchTimeSec ?? 0;
        const dur = item.duration ?? 0;
        if (sec <= 0 || dur <= 0) return "-";
        const pct = Math.min((sec / dur) * 100, 100);
        return `${pct.toFixed(1)}%`;
      }
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
  dataCount,
  onPress,
}: {
  videoId: string;
  title: string;
  publishedAt: string;
  isShort: boolean;
  hasData: boolean;
  dataCount: number;
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
              <Text style={{ fontSize: 9, color: "#22C55E", fontWeight: "700" }}>{dataCount}/4件入力済</Text>
            </View>
          )}
        </View>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

// ── Growth Chart ─────────────────────────────────────────────────────────────

const CHART_TIME_WINDOWS: TimeWindow[] = ["1h", "24h", "48h", "1week"];
const CHART_WINDOW_LABELS: Record<TimeWindow, string> = { "1h": "1h", "24h": "24h", "48h": "48h", "1week": "1w" };

interface GrowthChartItem {
  videoId: string;
  title: string | null;
  isShort: boolean | null;
  data: Partial<Record<TimeWindow, number>>;
}

function GrowthChart({ metric }: { metric: SortMetric }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const screenWidth = Dimensions.get("window").width;

  const q1h = trpc.analytics.getAllEarlyStats.useQuery({ timeWindow: "1h", sortBy: metric, limit: 100 }, { staleTime: 10_000 });
  const q24h = trpc.analytics.getAllEarlyStats.useQuery({ timeWindow: "24h", sortBy: metric, limit: 100 }, { staleTime: 10_000 });
  const q48h = trpc.analytics.getAllEarlyStats.useQuery({ timeWindow: "48h", sortBy: metric, limit: 100 }, { staleTime: 10_000 });
  const q1w = trpc.analytics.getAllEarlyStats.useQuery({ timeWindow: "1week", sortBy: metric, limit: 100 }, { staleTime: 10_000 });

  const isLoading = q1h.isLoading || q24h.isLoading || q48h.isLoading || q1w.isLoading;

  const videoMap = new Map<string, GrowthChartItem>();
  const addData = (rows: typeof q1h.data, tw: TimeWindow) => {
    for (const r of rows ?? []) {
      if (!videoMap.has(r.videoId)) {
        videoMap.set(r.videoId, { videoId: r.videoId, title: r.title, isShort: r.isShort, data: {} });
      }
      const val = metric === "avgWatchTimeSec" && r.duration && r.duration > 0
        ? Math.min(((r.avgWatchTimeSec ?? 0) / r.duration) * 100, 100)
        : (r[metric] as number) ?? 0;
      videoMap.get(r.videoId)!.data[tw] = val;
    }
  };
  addData(q1h.data, "1h");
  addData(q24h.data, "24h");
  addData(q48h.data, "48h");
  addData(q1w.data, "1week");

  const items = Array.from(videoMap.values()).filter(v => Object.keys(v.data).length >= 2);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.muted, textAlign: "center" }}>グラフデータがありません</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, textAlign: "center" }}>複数タイムウィンドウのデータを入力すると{"\n"}推移グラフが表示されます</Text>
      </View>
    );
  }

  const CHART_W = screenWidth - 32;
  const CHART_H = 160;
  const PAD_L = 48;
  const PAD_R = 12;
  const PAD_T = 16;
  const PAD_B = 28;
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const metricLabel = SORT_METRICS.find(m => m.key === metric)?.label ?? metric;
  const LINE_COLORS = ["#FF0000", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

  let globalMax = 0;
  for (const item of items) {
    for (const v of Object.values(item.data)) {
      if (v > globalMax) globalMax = v;
    }
  }
  if (globalMax === 0) globalMax = 1;

  const xPos = (twIdx: number) => PAD_L + (twIdx / (CHART_TIME_WINDOWS.length - 1)) * plotW;
  const yPos = (val: number) => PAD_T + plotH - (val / globalMax) * plotH;

  const formatYLabel = (val: number) => {
    if (metric === "views" || metric === "impressions") {
      if (val >= 10000) return `${(val / 10000).toFixed(0)}万`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
      return String(Math.round(val));
    }
    return `${val.toFixed(1)}%`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(r => ({ val: globalMax * r, y: yPos(globalMax * r) }));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
        {metricLabel}の推移（1時間 → 24時間 → 48時間 → 1週間）
      </Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 8, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
        <Svg width={CHART_W} height={CHART_H}>
          {yTicks.map((t, i) => (
            <Line key={i} x1={PAD_L} y1={t.y} x2={CHART_W - PAD_R} y2={t.y} stroke={colors.border} strokeWidth={0.5} strokeDasharray="4,3" />
          ))}
          {yTicks.map((t, i) => (
            <SvgText key={i} x={PAD_L - 4} y={t.y + 4} fontSize={9} fill={colors.muted} textAnchor="end">{formatYLabel(t.val)}</SvgText>
          ))}
          {CHART_TIME_WINDOWS.map((tw, i) => (
            <SvgText key={tw} x={xPos(i)} y={CHART_H - 6} fontSize={10} fill={colors.muted} textAnchor="middle">{CHART_WINDOW_LABELS[tw]}</SvgText>
          ))}
          {items.slice(0, 8).map((item, lineIdx) => {
            const pts = CHART_TIME_WINDOWS
              .map((tw, i) => item.data[tw] != null ? `${xPos(i)},${yPos(item.data[tw]!)}` : null)
              .filter(Boolean);
            if (pts.length < 2) return null;
            return (
              <Polyline
                key={item.videoId}
                points={pts.join(" ")}
                fill="none"
                stroke={LINE_COLORS[lineIdx % LINE_COLORS.length]}
                strokeWidth={1.8}
                strokeOpacity={0.85}
              />
            );
          })}
          {items.slice(0, 8).map((item, lineIdx) =>
            CHART_TIME_WINDOWS.map((tw, i) =>
              item.data[tw] != null ? (
                <Circle
                  key={`${item.videoId}-${tw}`}
                  cx={xPos(i)}
                  cy={yPos(item.data[tw]!)}
                  r={3}
                  fill={LINE_COLORS[lineIdx % LINE_COLORS.length]}
                />
              ) : null
            )
          )}
        </Svg>
      </View>
      {items.slice(0, 8).map((item, lineIdx) => (
        <View key={item.videoId} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 }}>
          <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: LINE_COLORS[lineIdx % LINE_COLORS.length] }} />
          <Text style={{ fontSize: 11, color: colors.foreground, flex: 1 }} numberOfLines={1}>
            {item.title ?? item.videoId}
          </Text>
        </View>
      ))}
      {items.length > 8 && (
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>+ {items.length - 8}本の動画</Text>
      )}
    </ScrollView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function EarlyStatsScreen() {
  const [activeTab, setActiveTab] = useState<"ranking" | "graph" | "input">("ranking");
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<TimeWindow>("24h");
  const [selectedSortMetric, setSelectedSortMetric] = useState<SortMetric>("views");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000) as unknown as number;
  }, []);

  useEffect(() => {
    return () => { if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current); };
  }, []);

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

  // Videos that have early stats (for "データあり" badge) + count per video
  const earlyStatsCountByVideo = new Map<string, number>();
  for (const r of (rankingQuery.data ?? [])) {
    earlyStatsCountByVideo.set(r.videoId, (earlyStatsCountByVideo.get(r.videoId) ?? 0) + 1);
  }
  const videosWithData = new Set(earlyStatsCountByVideo.keys());

  const handleVideoPress = (videoId: string, title: string) => {
    setSelectedVideo({ id: videoId, title });
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedVideo(null);
  };

  const handleSaved = useCallback(() => {
    rankingQuery.refetch();
    videoEarlyStatsQuery.refetch();
    showToast("保存しました");
  }, [rankingQuery, videoEarlyStatsQuery, showToast]);

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
          <Text style={{ fontSize: 12, fontWeight: "700", color: activeTab === "ranking" ? "#0F0F0F" : "#9CA3AF" }}>ランキング</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("graph")}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: activeTab === "graph" ? "#fff" : "transparent", alignItems: "center" }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: activeTab === "graph" ? "#0F0F0F" : "#9CA3AF" }}>推移グラフ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("input")}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: activeTab === "input" ? "#fff" : "transparent", alignItems: "center" }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: activeTab === "input" ? "#0F0F0F" : "#9CA3AF" }}>データ入力</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "graph" ? (
        <GrowthChart metric={selectedSortMetric} />
      ) : activeTab === "ranking" ? (
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

          {/* Sort metric filter - 横並び均等配置 */}
          <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 8, gap: 5 }}>
            {SORT_METRICS.map(m => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setSelectedSortMetric(m.key)}
                style={{
                  flex: 1,
                  paddingHorizontal: 2,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: selectedSortMetric === m.key ? "#0F0F0F" : "#F3F4F6",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "600", color: selectedSortMetric === m.key ? "#fff" : "#606060" }} numberOfLines={1}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
              dataCount={earlyStatsCountByVideo.get(item.id) ?? 0}
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

      {/* Toast notification */}
      {toastVisible && (
        <View style={{
          position: "absolute",
          bottom: 90,
          left: 20,
          right: 20,
          backgroundColor: "rgba(0,0,0,0.75)",
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          alignItems: "center",
          zIndex: 999,
        }}>
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{toastMessage}</Text>
        </View>
      )}
    </ScreenContainer>
  );
}
