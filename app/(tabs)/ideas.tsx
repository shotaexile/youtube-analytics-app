import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  FlatList,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useAiSubNav } from "@/lib/ai-subnav-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  title: string;
  summary: string;
  category: string;
  impact: "high" | "medium" | "low";
  url?: string;
  sourceUrl?: string;
  publishedAt?: string;
}

interface LedgeNewsItem {
  title: string;
  url: string;
  publishedAt: string;
}

interface ToolItem {
  rank: number;
  toolName: string;
  description: string;
  bestFor: string;
  url?: string;
  score?: string;
}

interface RankingCategory {
  category: string;
  tools: ToolItem[];
}

interface AiTool {
  name: string;
  url: string;
  description: string;
  pricing?: string;
}

interface AiToolGenre {
  genre: string;
  emoji: string;
  tools: AiTool[];
}

interface InfoSource {
  id: number;
  category: "youtube" | "x" | "website";
  title: string;
  url: string;
  memo: string | null;
}

// ─── Static AI Tool List ──────────────────────────────────────────────────────

const AI_TOOL_GENRES: AiToolGenre[] = [
  {
    genre: "動画生成",
    emoji: "🎬",
    tools: [
      { name: "Sora", url: "https://sora.com/", description: "OpenAIの動画生成AI。テキストから高品質な動画を生成", pricing: "有料" },
      { name: "Kling AI", url: "https://klingai.com/", description: "中国発の高品質動画生成AI。リアルな動きが得意", pricing: "フリーミアム" },
      { name: "Runway Gen-3", url: "https://runwayml.com/", description: "プロ向け動画生成・編集AI。映像制作に特化", pricing: "フリーミアム" },
      { name: "Veo 3", url: "https://deepmind.google/technologies/veo/", description: "Google DeepMindの最新動画生成AI", pricing: "有料" },
      { name: "Domo AI", url: "https://domoai.app/", description: "アニメ・イラスト風動画変換に特化したAI", pricing: "フリーミアム" },
      { name: "Pika Labs", url: "https://pika.art/", description: "テキスト・画像から動画を生成するAI", pricing: "フリーミアム" },
      { name: "Hailuo AI", url: "https://hailuoai.video/", description: "MiniMaxの動画生成AI。高品質な映像表現", pricing: "フリーミアム" },
      { name: "Luma Dream Machine", url: "https://lumalabs.ai/dream-machine", description: "リアルな動きと物理表現が得意な動画AI", pricing: "フリーミアム" },
      { name: "Wan 2.1", url: "https://wan.video/", description: "Alibabaの動画生成AI。オープンソース版あり", pricing: "フリーミアム" },
    ],
  },
  {
    genre: "画像生成",
    emoji: "🖼️",
    tools: [
      { name: "Midjourney", url: "https://www.midjourney.com/", description: "最高品質の画像生成AI。アーティスティックな表現が得意", pricing: "有料" },
      { name: "DALL-E 3", url: "https://openai.com/dall-e-3", description: "OpenAIの画像生成AI。ChatGPTと連携可能", pricing: "有料" },
      { name: "Stable Diffusion", url: "https://stability.ai/", description: "オープンソースの画像生成AI。カスタマイズ自由", pricing: "無料/有料" },
      { name: "Adobe Firefly", url: "https://firefly.adobe.com/", description: "Adobe製の商用利用安全な画像生成AI", pricing: "フリーミアム" },
      { name: "Ideogram", url: "https://ideogram.ai/", description: "テキスト入り画像生成が得意なAI", pricing: "フリーミアム" },
      { name: "Flux", url: "https://blackforestlabs.ai/", description: "Black Forest Labsの高品質画像生成AI", pricing: "フリーミアム" },
      { name: "Leonardo AI", url: "https://leonardo.ai/", description: "ゲーム・クリエイティブ向け画像生成AI", pricing: "フリーミアム" },
      { name: "Canva AI", url: "https://www.canva.com/ai-image-generator/", description: "デザインツールCanvaに統合された画像生成AI", pricing: "フリーミアム" },
    ],
  },
  {
    genre: "音楽生成",
    emoji: "🎵",
    tools: [
      { name: "Suno AI", url: "https://suno.com/", description: "テキストから楽曲を丸ごと生成するAI。歌詞・メロディ・ボーカル込み", pricing: "フリーミアム" },
      { name: "Udio", url: "https://www.udio.com/", description: "高品質な音楽生成AI。多様なジャンルに対応", pricing: "フリーミアム" },
      { name: "Stable Audio", url: "https://stability.ai/stable-audio", description: "Stability AIの音楽・効果音生成AI", pricing: "フリーミアム" },
      { name: "MusicGen", url: "https://huggingface.co/facebook/musicgen-large", description: "Metaのオープンソース音楽生成AI", pricing: "無料" },
      { name: "Mubert", url: "https://mubert.com/", description: "BGM・ループ音楽生成に特化したAI", pricing: "フリーミアム" },
    ],
  },
  {
    genre: "テキスト生成",
    emoji: "✍️",
    tools: [
      { name: "ChatGPT", url: "https://chat.openai.com/", description: "OpenAIの汎用AIチャット。最も普及したAIアシスタント", pricing: "フリーミアム" },
      { name: "Claude", url: "https://claude.ai/", description: "Anthropicの高性能AI。長文処理・コーディングが得意", pricing: "フリーミアム" },
      { name: "Gemini", url: "https://gemini.google.com/", description: "Googleの最新AI。マルチモーダル対応", pricing: "フリーミアム" },
      { name: "Grok", url: "https://grok.x.ai/", description: "xAI（イーロン・マスク）のAI。リアルタイム情報に強い", pricing: "フリーミアム" },
      { name: "Perplexity", url: "https://www.perplexity.ai/", description: "AI検索エンジン。ソース付きで情報を提供", pricing: "フリーミアム" },
      { name: "Notion AI", url: "https://www.notion.so/product/ai", description: "Notionに統合されたAIライティングアシスタント", pricing: "有料" },
      { name: "Jasper", url: "https://www.jasper.ai/", description: "マーケティング・コピーライティング特化AI", pricing: "有料" },
    ],
  },
  {
    genre: "コーディング",
    emoji: "💻",
    tools: [
      { name: "GitHub Copilot", url: "https://github.com/features/copilot", description: "GitHubのAIコーディングアシスタント。コード補完・生成", pricing: "有料" },
      { name: "Cursor", url: "https://cursor.sh/", description: "AI統合コードエディタ。コードベース全体を理解して支援", pricing: "フリーミアム" },
      { name: "Windsurf", url: "https://codeium.com/windsurf", description: "Codeiumのエージェント型AIコードエディタ", pricing: "フリーミアム" },
      { name: "v0", url: "https://v0.dev/", description: "VercelのUI生成AI。テキストからReactコンポーネントを生成", pricing: "フリーミアム" },
      { name: "Bolt.new", url: "https://bolt.new/", description: "ブラウザ上でフルスタックアプリを生成するAI", pricing: "フリーミアム" },
      { name: "Replit AI", url: "https://replit.com/", description: "クラウドIDEに統合されたAIコーディング支援", pricing: "フリーミアム" },
    ],
  },
  {
    genre: "音声・翻訳",
    emoji: "🎤",
    tools: [
      { name: "ElevenLabs", url: "https://elevenlabs.io/", description: "高品質な音声合成AI。声のクローンも可能", pricing: "フリーミアム" },
      { name: "Whisper", url: "https://openai.com/research/whisper", description: "OpenAIの音声認識AI。多言語対応", pricing: "無料" },
      { name: "DeepL", url: "https://www.deepl.com/", description: "高精度AI翻訳ツール。ビジネス文書に強い", pricing: "フリーミアム" },
      { name: "HeyGen", url: "https://www.heygen.com/", description: "AIアバター動画・音声翻訳ツール", pricing: "フリーミアム" },
      { name: "Descript", url: "https://www.descript.com/", description: "テキスト編集で動画・音声を編集できるAIツール", pricing: "フリーミアム" },
    ],
  },
  {
    genre: "業務効率化",
    emoji: "⚡",
    tools: [
      { name: "Zapier AI", url: "https://zapier.com/", description: "業務自動化ツール。AIでワークフローを構築", pricing: "フリーミアム" },
      { name: "Make (Integromat)", url: "https://www.make.com/", description: "ノーコード自動化プラットフォーム", pricing: "フリーミアム" },
      { name: "Gamma", url: "https://gamma.app/", description: "AIでプレゼン・資料を自動生成するツール", pricing: "フリーミアム" },
      { name: "Beautiful.ai", url: "https://www.beautiful.ai/", description: "AIが自動でデザインするプレゼンツール", pricing: "有料" },
      { name: "Otter.ai", url: "https://otter.ai/", description: "会議の音声をAIでリアルタイム文字起こし", pricing: "フリーミアム" },
      { name: "Fireflies.ai", url: "https://fireflies.ai/", description: "会議録音・要約・検索ができるAIツール", pricing: "フリーミアム" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function openUrl(url?: string) {
  if (!url) return;
  Linking.openURL(url).catch(() => {});
}

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
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

/** ai-gallery.jp article card */
function ArticleCard({ item }: { item: NewsItem }) {
  const colors = useColors();
  const linkUrl = item.url ?? item.sourceUrl;
  const hasLink = !!linkUrl;
  const dateStr = formatDate(item.publishedAt);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryTag, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
        </View>
        <ImpactBadge impact={item.impact} />
        {dateStr ? (
          <Text style={[styles.dateText, { color: colors.muted }]}>{dateStr}</Text>
        ) : null}
      </View>
      {hasLink ? (
        <TouchableOpacity onPress={() => openUrl(linkUrl)} activeOpacity={0.7}>
          <Text style={[styles.cardTitle, styles.linkTitle, { color: colors.primary }]}>
            {item.title}
          </Text>
          <Text style={[styles.linkHint, { color: colors.muted }]}>🔗 タップして詳細を見る</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
      )}
      <Text style={[styles.cardBody, { color: colors.muted }]}>{item.summary}</Text>
    </View>
  );
}

/** ledge.ai news card */
function LedgeNewsCard({ item }: { item: LedgeNewsItem }) {
  const colors = useColors();
  const dateStr = formatDate(item.publishedAt);

  return (
    <TouchableOpacity
      onPress={() => openUrl(item.url)}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {dateStr ? (
        <Text style={[styles.dateText, { color: colors.muted, marginBottom: 6 }]}>{dateStr}</Text>
      ) : null}
      <Text style={[styles.cardTitle, styles.linkTitle, { color: colors.primary }]}>
        {item.title}
      </Text>
      <Text style={[styles.linkHint, { color: colors.muted }]}>🔗 ledge.ai で読む</Text>
    </TouchableOpacity>
  );
}

function RankingCard({ category }: { category: RankingCategory }) {
  const colors = useColors();
  const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.primary }]}>{category.category}</Text>
      {(category.tools ?? []).slice(0, 3).map((tool, i) => {
        const hasLink = !!tool.url;
        return (
          <TouchableOpacity
            key={tool.toolName}
            onPress={() => hasLink && openUrl(tool.url)}
            activeOpacity={hasLink ? 0.7 : 1}
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
              <View style={styles.toolNameRow}>
                <Text style={[styles.toolName, { color: colors.foreground }]}>{tool.toolName}</Text>
                {hasLink && (
                  <Text style={[styles.linkIcon, { color: colors.primary }]}>🔗</Text>
                )}
              </View>
              <Text style={[styles.toolDesc, { color: colors.muted }]}>{tool.description}</Text>
              <Text style={[styles.toolBest, { color: colors.primary }]}>✓ {tool.bestFor}</Text>
              {tool.score ? (
                <Text style={[styles.toolScore, { color: colors.success }]}>📊 {tool.score}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** AI tool card for the tool list tab */
function AiToolCard({ tool }: { tool: AiTool }) {
  const colors = useColors();
  const pricingColor =
    tool.pricing === "無料"
      ? colors.success
      : tool.pricing === "フリーミアム"
      ? colors.warning
      : tool.pricing === "有料"
      ? colors.error
      : colors.muted;

  return (
    <TouchableOpacity
      onPress={() => openUrl(tool.url)}
      activeOpacity={0.75}
      style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.toolCardHeader}>
        <Text style={[styles.toolCardName, { color: colors.primary }]}>{tool.name}</Text>
        {tool.pricing ? (
          <View style={[styles.badge, { backgroundColor: pricingColor + "22", borderColor: pricingColor, borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: pricingColor }]}>{tool.pricing}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.toolCardDesc, { color: colors.muted }]}>{tool.description}</Text>
      <Text style={[styles.toolCardLink, { color: colors.primary }]}>🔗 公式サイトを開く</Text>
    </TouchableOpacity>
  );
}

/** Info source card */
function InfoSourceCard({
  source,
  onEditMemo,
  onDelete,
}: {
  source: InfoSource;
  onEditMemo: (source: InfoSource) => void;
  onDelete: (id: number) => void;
}) {
  const colors = useColors();
  const catEmoji = source.category === "youtube" ? "▶️" : source.category === "x" ? "𝕏" : "🌐";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sourceCardHeader}>
        <Text style={[styles.sourceEmoji]}>{catEmoji}</Text>
        <TouchableOpacity onPress={() => openUrl(source.url)} activeOpacity={0.7} style={styles.sourceTitleWrap}>
          <Text style={[styles.sourceTitle, { color: colors.primary }]}>{source.title}</Text>
          <Text style={[styles.sourceUrl, { color: colors.muted }]} numberOfLines={1}>{source.url}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(source.id)}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.deleteBtnText, { color: colors.error }]}>✕</Text>
        </TouchableOpacity>
      </View>
      {source.memo ? (
        <View style={[styles.memoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.memoText, { color: colors.foreground }]}>{source.memo}</Text>
        </View>
      ) : null}
      <TouchableOpacity
        onPress={() => onEditMemo(source)}
        style={[styles.memoEditBtn, { borderColor: colors.border }]}
      >
        <Text style={[styles.memoEditBtnText, { color: colors.muted }]}>
          {source.memo ? "📝 備考を編集" : "📝 備考を追加"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Password Modal ───────────────────────────────────────────────────────────

function AdminPasswordModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const colors = useColors();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const verifyMutation = trpc.aiInfo.verifyAdminPassword.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        setPassword("");
        setError("");
        onSuccess();
      } else {
        setError("パスワードが正しくありません");
      }
    },
    onError: () => setError("認証に失敗しました"),
  });

  const handleSubmit = () => {
    if (!password.trim()) {
      setError("パスワードを入力してください");
      return;
    }
    verifyMutation.mutate({ password });
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>管理者認証</Text>
          <Text style={[styles.modalDesc, { color: colors.muted }]}>
            AI情報を今すぐ生成するには管理者パスワードが必要です。
          </Text>
          <TextInput
            style={[
              styles.passwordInput,
              {
                backgroundColor: colors.background,
                borderColor: error ? colors.error : colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="パスワードを入力"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            autoFocus
          />
          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : null}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.modalCancelText, { color: colors.muted }]}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalConfirmText}>確認</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Source Modal ─────────────────────────────────────────────────────────

function AddSourceModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { category: "youtube" | "x" | "website"; title: string; url: string; memo?: string }) => void;
}) {
  const colors = useColors();
  const [category, setCategory] = useState<"youtube" | "x" | "website">("website");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (!url.trim()) { setError("URLを入力してください"); return; }
    if (!url.startsWith("http")) { setError("URLはhttpまたはhttpsで始めてください"); return; }
    onAdd({ category, title: title.trim(), url: url.trim(), memo: memo.trim() || undefined });
    setTitle(""); setUrl(""); setMemo(""); setError("");
    onClose();
  };

  const handleClose = () => {
    setTitle(""); setUrl(""); setMemo(""); setError("");
    onClose();
  };

  const cats: { key: "youtube" | "x" | "website"; label: string }[] = [
    { key: "youtube", label: "YouTube" },
    { key: "x", label: "X (Twitter)" },
    { key: "website", label: "ウェブサイト" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>情報ソースを追加</Text>

          {/* Category selector */}
          <View style={styles.catSelector}>
            {cats.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[
                  styles.catChip,
                  { backgroundColor: category === c.key ? colors.primary : colors.background, borderColor: category === c.key ? colors.primary : colors.border },
                ]}
              >
                <Text style={[styles.catChipText, { color: category === c.key ? "#fff" : colors.muted }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.passwordInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="タイトル（例：KEITO AI ch）"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={(t) => { setTitle(t); setError(""); }}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.passwordInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="URL（https://...）"
            placeholderTextColor={colors.muted}
            value={url}
            onChangeText={(t) => { setUrl(t); setError(""); }}
            returnKeyType="next"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            style={[styles.passwordInput, styles.memoInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="備考（任意）"
            placeholderTextColor={colors.muted}
            value={memo}
            onChangeText={setMemo}
            returnKeyType="done"
            multiline
            numberOfLines={3}
          />
          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : null}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.border }]} onPress={handleClose}>
              <Text style={[styles.modalCancelText, { color: colors.muted }]}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
              <Text style={styles.modalConfirmText}>追加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Edit Memo Modal ──────────────────────────────────────────────────────────

function EditMemoModal({
  visible,
  source,
  onClose,
  onSave,
}: {
  visible: boolean;
  source: InfoSource | null;
  onClose: () => void;
  onSave: (id: number, memo: string) => void;
}) {
  const colors = useColors();
  const [memo, setMemo] = useState(source?.memo ?? "");

  // Sync memo when source changes
  useState(() => { setMemo(source?.memo ?? ""); });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>備考を編集</Text>
          {source ? (
            <Text style={[styles.modalDesc, { color: colors.muted }]}>{source.title}</Text>
          ) : null}
          <TextInput
            style={[styles.passwordInput, styles.memoInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="備考を入力（メモ・感想・使い方など）"
            placeholderTextColor={colors.muted}
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={5}
            autoFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.modalCancelText, { color: colors.muted }]}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
              onPress={() => { if (source) { onSave(source.id, memo); onClose(); } }}
            >
              <Text style={styles.modalConfirmText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Tab = "articles" | "news" | "rankings" | "tools" | "sources";

export default function IdeasScreen() {
  const colors = useColors();
  const { activeTab } = useAiSubNav();
  const [refreshing, setRefreshing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [rankingFilter, setRankingFilter] = useState<string | null>(null);
  const [toolGenreFilter, setToolGenreFilter] = useState<string>(AI_TOOL_GENRES[0].genre);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState<InfoSource | null>(null);
  const [sourceCatFilter, setSourceCatFilter] = useState<"all" | "youtube" | "x" | "website">("all");

  const {
    data: report,
    isLoading,
    refetch,
  } = trpc.aiInfo.getLatestReport.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 60 * 1000,
  });

  const {
    data: infoSourcesData,
    refetch: refetchSources,
  } = trpc.aiInfo.getInfoSources.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: true,
  });

  const addSourceMutation = trpc.aiInfo.addInfoSource.useMutation({
    onSuccess: () => refetchSources(),
  });

  const updateMemoMutation = trpc.aiInfo.updateInfoSourceMemo.useMutation({
    onSuccess: () => refetchSources(),
  });

  const deleteSourceMutation = trpc.aiInfo.deleteInfoSource.useMutation({
    onSuccess: () => refetchSources(),
  });

  const generateMutation = trpc.aiInfo.generateReport.useMutation({
    onSuccess: async () => { await refetch(); },
    onSettled: () => setRefreshing(false),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePressGenerate = () => setShowPasswordModal(true);

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setRefreshing(true);
    generateMutation.mutate();
  };

  const handleDeleteSource = (id: number) => {
    Alert.alert("削除確認", "この情報ソースを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deleteSourceMutation.mutate({ id }) },
    ]);
  };

  const latestNews: NewsItem[] = (report?.latestNews as NewsItem[]) ?? [];
  const ledgeNews: LedgeNewsItem[] = (report?.ledgeNews as LedgeNewsItem[]) ?? [];
  const toolRankings: RankingCategory[] = (report?.toolRankings as RankingCategory[]) ?? [];
  const rankingCategories = toolRankings.map((r) => r.category);
  const filteredRankings = rankingFilter
    ? toolRankings.filter((r) => r.category === rankingFilter)
    : toolRankings;

  const infoSources: InfoSource[] = (infoSourcesData as InfoSource[]) ?? [];
  const filteredSources = sourceCatFilter === "all"
    ? infoSources
    : infoSources.filter((s) => s.category === sourceCatFilter);

  const currentGenre = AI_TOOL_GENRES.find((g) => g.genre === toolGenreFilter) ?? AI_TOOL_GENRES[0];

  const reportDateStr = report?.reportDate
    ? typeof report.reportDate === "string"
      ? report.reportDate
      : new Date(report.reportDate as Date).toLocaleDateString("ja-JP")
    : null;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AIツールまとめ</Text>
          {reportDateStr ? (
            <Text style={[styles.headerSub, { color: colors.muted }]}>最終更新: {reportDateStr}</Text>
          ) : (
            <Text style={[styles.headerSub, { color: colors.muted }]}>毎朝7時に自動更新</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
          disabled={isLoading || refreshing}
        >
          {isLoading || refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.refreshBtnText}>更新</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && (activeTab === "articles" || activeTab === "news" || activeTab === "rankings") ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>読み込み中...</Text>
        </View>
      ) : !report && (activeTab === "articles" || activeTab === "news" || activeTab === "rankings") ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🤖</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>まだデータがありません</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            「今すぐ生成する」を押すと、AIツールの最新情報を収集します。{"\n"}毎朝7時に自動更新されます。
          </Text>
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: colors.primary }]}
            onPress={handlePressGenerate}
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* ── 最新記事 (ai-gallery.jp) ── */}
          {activeTab === "articles" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>最新記事</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                AI Gallery（ai-gallery.jp）の最新AIツール記事
              </Text>
              {latestNews.length === 0 ? (
                <Text style={[styles.emptyBody, { color: colors.muted, textAlign: "center", marginTop: 24 }]}>
                  記事データがありません
                </Text>
              ) : (
                latestNews.map((item, i) => <ArticleCard key={i} item={item} />)
              )}
            </>
          )}

          {/* ── 最新ニュース (ledge.ai) ── */}
          {activeTab === "news" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>最新ニュース</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                Ledge.ai（ledge.ai）の最新AIニュース
              </Text>
              {ledgeNews.length === 0 ? (
                <View style={styles.center}>
                  <Text style={[styles.emptyBody, { color: colors.muted, textAlign: "center", marginTop: 24 }]}>
                    ニュースデータがありません{"\n"}更新ボタンを押してください
                  </Text>
                </View>
              ) : (
                ledgeNews.map((item, i) => <LedgeNewsCard key={i} item={item} />)
              )}
            </>
          )}

          {/* ── ツール比較 (Artificial Analysis) ── */}
          {activeTab === "rankings" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AIモデル性能比較</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                Artificial Analysis調べ｜知能指数・GDPval・速度・価格など全カテゴリ比較
              </Text>
              {toolRankings.length === 0 ? (
                <Text style={[styles.emptyBody, { color: colors.muted, textAlign: "center", marginTop: 24 }]}>
                  ランキングデータがありません
                </Text>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 12 }}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                  >
                    <TouchableOpacity
                      onPress={() => setRankingFilter(null)}
                      style={[styles.filterChip, { backgroundColor: !rankingFilter ? colors.primary : colors.surface, borderColor: !rankingFilter ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.filterChipText, { color: !rankingFilter ? "#fff" : colors.muted }]}>すべて</Text>
                    </TouchableOpacity>
                    {rankingCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setRankingFilter(rankingFilter === cat ? null : cat)}
                        style={[styles.filterChip, { backgroundColor: rankingFilter === cat ? colors.primary : colors.surface, borderColor: rankingFilter === cat ? colors.primary : colors.border }]}
                      >
                        <Text style={[styles.filterChipText, { color: rankingFilter === cat ? "#fff" : colors.muted }]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {filteredRankings.map((cat, i) => <RankingCard key={i} category={cat} />)}
                </>
              )}
            </>
          )}

          {/* ── AIツール一覧 ── */}
          {activeTab === "tools" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AIツール一覧</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                ジャンル別に市場の主要AIツールをまとめました。タップで公式サイトへ
              </Text>
              {/* Genre filter chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {AI_TOOL_GENRES.map((g) => (
                  <TouchableOpacity
                    key={g.genre}
                    onPress={() => setToolGenreFilter(g.genre)}
                    style={[styles.filterChip, { backgroundColor: toolGenreFilter === g.genre ? colors.primary : colors.surface, borderColor: toolGenreFilter === g.genre ? colors.primary : colors.border }]}
                  >
                    <Text style={[styles.filterChipText, { color: toolGenreFilter === g.genre ? "#fff" : colors.muted }]}>
                      {g.emoji} {g.genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Tool cards */}
              {currentGenre.tools.map((tool) => (
                <AiToolCard key={tool.name} tool={tool} />
              ))}
            </>
          )}

          {/* ── 情報ソース ── */}
          {activeTab === "sources" && (
            <>
              <View style={styles.sourcesHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>情報ソース</Text>
                  <Text style={[styles.sectionDesc, { color: colors.muted, marginBottom: 0 }]}>
                    AI情報を発信しているチャンネル・サイト一覧
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addSourceBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAddSourceModal(true)}
                >
                  <Text style={styles.addSourceBtnText}>＋ 追加</Text>
                </TouchableOpacity>
              </View>

              {/* Category filter */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {([
                  { key: "all", label: "すべて" },
                  { key: "youtube", label: "▶️ YouTube" },
                  { key: "x", label: "𝕏 X" },
                  { key: "website", label: "🌐 ウェブ" },
                ] as { key: typeof sourceCatFilter; label: string }[]).map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setSourceCatFilter(c.key)}
                    style={[styles.filterChip, { backgroundColor: sourceCatFilter === c.key ? colors.primary : colors.surface, borderColor: sourceCatFilter === c.key ? colors.primary : colors.border }]}
                  >
                    <Text style={[styles.filterChipText, { color: sourceCatFilter === c.key ? "#fff" : colors.muted }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredSources.length === 0 ? (
                <Text style={[styles.emptyBody, { color: colors.muted, textAlign: "center", marginTop: 24 }]}>
                  情報ソースがありません{"\n"}「＋ 追加」ボタンで追加できます
                </Text>
              ) : (
                filteredSources.map((source) => (
                  <InfoSourceCard
                    key={source.id}
                    source={source}
                    onEditMemo={(s) => { setEditingSource(s); }}
                    onDelete={handleDeleteSource}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <AdminPasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
      <AddSourceModal
        visible={showAddSourceModal}
        onClose={() => setShowAddSourceModal(false)}
        onAdd={(data) => addSourceMutation.mutate(data)}
      />
      <EditMemoModal
        visible={!!editingSource}
        source={editingSource}
        onClose={() => setEditingSource(null)}
        onSave={(id, memo) => updateMemoMutation.mutate({ id, memo })}
      />
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
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 4,
  },
  linkTitle: {
    textDecorationLine: "underline",
  },
  linkHint: {
    fontSize: 11,
    marginBottom: 6,
  },
  linkIcon: {
    fontSize: 13,
    marginLeft: 4,
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
  toolNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  toolName: {
    fontSize: 14,
    fontWeight: "700",
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
  toolScore: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  // AI Tool List
  toolCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  toolCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  toolCardName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  toolCardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  toolCardLink: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Info Sources
  sourcesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addSourceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 4,
  },
  addSourceBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  sourceCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  sourceEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  sourceTitleWrap: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 11,
    lineHeight: 16,
  },
  deleteBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  memoBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 0.5,
  },
  memoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  memoEditBtn: {
    paddingVertical: 6,
    borderTopWidth: 0.5,
    alignItems: "center",
  },
  memoEditBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Modal
  catSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  catChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  catChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  memoInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
    borderWidth: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 11,
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
});
