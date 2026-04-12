import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getLatestAiDailyReport, upsertAiDailyReport } from "./db";
import { z } from "zod";

/**
 * AI Information Router
 * - AI News: fetched from ai-gallery.jp WordPress REST API (real articles, real links)
 * - Tool Rankings: directly parsed from Artificial Analysis HTML (real-time data)
 * - Video AI Tools: LLM-generated with latest knowledge
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z#0-9]+;/g, (e) => {
    const map: Record<string, string> = {
      "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'",
      "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–", "&hellip;": "…",
    };
    return map[e] ?? e;
  }).trim();
}

// ─── AI Gallery News ──────────────────────────────────────────────────────────

/** Fetch latest AI news from ai-gallery.jp WordPress REST API */
async function fetchAiGalleryNews(): Promise<Array<{
  title: string;
  summary: string;
  category: string;
  impact: "high" | "medium" | "low";
  url: string;
  publishedAt: string;
}>> {
  // Category 495 = 生成AIニュース, 400 = 生成AIツール, 318 = 生成AI基本知識
  // Category 319 = 生成AI活用事例, 1 = ChatGPT特集
  const categoryIds = [495, 400, 319, 1, 318];
  const allPosts: Array<{
    title: string;
    summary: string;
    category: string;
    impact: "high" | "medium" | "low";
    url: string;
    publishedAt: string;
  }> = [];

  for (const catId of categoryIds) {
    try {
      const res = await fetch(
        `https://ai-gallery.jp/wp-json/wp/v2/posts?per_page=5&categories=${catId}&_fields=id,title,link,date,excerpt&orderby=date&order=desc`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; ViewCore/1.0)" } }
      );
      if (!res.ok) continue;
      const posts = await res.json() as Array<{
        title: { rendered: string };
        link: string;
        date: string;
        excerpt: { rendered: string };
      }>;

      const catName = catId === 495 ? "AIニュース" : catId === 400 ? "AIツール" : catId === 319 ? "AI活用事例" : catId === 1 ? "ChatGPT" : "AI基礎知識";
      const impact: "high" | "medium" | "low" = catId === 495 ? "high" : catId === 400 || catId === 319 ? "medium" : "low";

      for (const post of posts) {
        const title = stripHtml(post.title.rendered);
        const summary = stripHtml(post.excerpt.rendered).slice(0, 120);
        allPosts.push({
          title,
          summary: summary || title,
          category: catName,
          impact,
          url: post.link,
          publishedAt: post.date.slice(0, 10),
        });
      }
    } catch {
      // ignore per-category errors
    }
  }

  // Deduplicate by URL and return latest 15
  const seen = new Set<string>();
  return allPosts
    .filter((p) => { if (seen.has(p.url)) return false; seen.add(p.url); return true; })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 15);
}

// ─── Artificial Analysis Rankings ─────────────────────────────────────────────

interface AaModel {
  modelName: string;
  detailsUrl?: string;
  intelligenceIndex?: number;
  medianOutputSpeed?: number;
  outputSpeed?: number;
  pricePerMillionTokens?: number;
  omniscienceIndex?: number;
  [key: string]: unknown;
}

/** Parse a data block from Artificial Analysis HTML */
function parseAaDataBlock(html: string, fieldName: string): AaModel[] {
  const pattern = new RegExp(
    `"data":\\[([^\\[\\]]*"${fieldName}"[^\\[\\]]*)\\]`,
    "g"
  );
  const match = pattern.exec(html);
  if (!match) return [];

  const items: AaModel[] = [];
  const itemPattern = /\{"modelName":"([^"]+)"([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = itemPattern.exec(match[1])) !== null) {
    const name = m[1];
    const rest = m[2];
    const item: AaModel = { modelName: name };

    // Extract detailsUrl
    const urlMatch = /"detailsUrl":"([^"]+)"/.exec(rest);
    if (urlMatch) item.detailsUrl = urlMatch[1];

    // Extract the target field value
    const fieldMatch = new RegExp(`"${fieldName}":([\\.\\d]+)`).exec(rest);
    if (fieldMatch) {
      (item as Record<string, unknown>)[fieldName] = parseFloat(fieldMatch[1]);
    }

    items.push(item);
  }
  return items;
}

/**
 * Parse image/video model ELO rankings from Artificial Analysis media pages.
 * The HTML uses escaped JSON: \"name\":\"ModelName\",...\"elos\":[{\"elo\":1234.56}]
 */
async function fetchAaMediaRankings(mediaType: "image" | "video"): Promise<Array<{
  rank: number;
  toolName: string;
  description: string;
  bestFor: string;
  url: string;
  score?: string;
}>> {
  const pageUrl = mediaType === "image"
    ? "https://artificialanalysis.ai/text-to-image"
    : "https://artificialanalysis.ai/video";

  let html = "";
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    if (res.ok) html = await res.text();
  } catch {
    return [];
  }

  if (!html || html.length < 10000) return [];

  // Extract model family names with their ELO scores
  // Pattern in HTML: \"name\":\"ModelName\",...\"elos\":[{\"elo\":1234.56,...}]
  const urlPrefix = mediaType === "image" ? "/image/model-families/" : "/video/model-families/";
  const baseUrl = "https://artificialanalysis.ai";

  // Find all occurrences of name + url + elos pattern
  const entryPattern = /\\"name\\":\\"([^\\]+)\\"[^}]{0,300}\\"url\\":\\"(\/(?:image|video)\/model-families\/[^\\]+)\\"[^}]{0,500}\\"elos\\":\[\{\\"elo\\":([\.\d]+)/g;
  const seen = new Map<string, { elo: number; url: string }>();
  let m: RegExpExecArray | null;
  while ((m = entryPattern.exec(html)) !== null) {
    const name = m[1];
    const urlPath = m[2];
    const elo = parseFloat(m[3]);
    if (!seen.has(name) || seen.get(name)!.elo < elo) {
      seen.set(name, { elo, url: urlPath });
    }
  }

  if (seen.size === 0) return [];

  const sorted = Array.from(seen.entries())
    .sort((a, b) => b[1].elo - a[1].elo)
    .slice(0, 8);

  // Model descriptions for well-known image/video AI tools
  const imageDescriptions: Record<string, { desc: string; bestFor: string }> = {
    "Midjourney": { desc: "高品質アート生成の定番ツール", bestFor: "芸術的・高品質な画像生成" },
    "OpenAI GPT": { desc: "OpenAIのGPT-4o画像生成", bestFor: "テキスト付き画像・汎用生成" },
    "Gemini": { desc: "GoogleのImagen搭載モデル", bestFor: "リアルな写真・多様なスタイル" },
    "Riverflow": { desc: "高速・高品質な画像生成", bestFor: "商用利用・高速生成" },
    "FLUX": { desc: "Black Forestの高品質オープンモデル", bestFor: "リアル写真・ファインチューニング" },
    "Ideogram": { desc: "テキスト描画が得意な画像生成AI", bestFor: "ロゴ・テキスト入り画像" },
    "Recraft": { desc: "デザイン特化の画像生成AI", bestFor: "UI/UX・ベクターデザイン" },
    "Seedream": { desc: "バイトダンス発の高品質モデル", bestFor: "アニメ・イラスト生成" },
    "Adobe Firefly": { desc: "Adobeの商用安全な画像生成AI", bestFor: "商用利用・著作権フリー" },
    "Imagen": { desc: "Google DeepMindの画像生成モデル", bestFor: "リアルな写真生成" },
  };
  const videoDescriptions: Record<string, { desc: string; bestFor: string }> = {
    "Kling": { desc: "Kuaishouの高品質動画生成AI", bestFor: "リアルな動画・長尺生成" },
    "Sora": { desc: "OpenAIの革新的動画生成AI", bestFor: "高品質・長尺動画生成" },
    "Runway": { desc: "プロ向け動画生成・編集AI", bestFor: "映像制作・エフェクト" },
    "Pika": { desc: "高速動画生成のスタートアップ", bestFor: "短尺・クリエイティブ動画" },
    "Veo": { desc: "GoogleのDeepMind動画生成AI", bestFor: "高品質・映画的動画" },
    "Wan": { desc: "Alibabaの動画生成モデル", bestFor: "中国語コンテンツ・汎用" },
    "HunyuanVideo": { desc: "Tencentの高品質動画生成AI", bestFor: "リアル動画・長尺生成" },
    "LTX": { desc: "Lightricks製の高速動画生成", bestFor: "高速・低コスト動画生成" },
    "CogVideoX": { desc: "清華大学発のオープン動画AI", bestFor: "オープンソース・カスタマイズ" },
  };
  const descMap = mediaType === "image" ? imageDescriptions : videoDescriptions;

  function getMediaInfo(name: string): { desc: string; bestFor: string } {
    for (const [key, info] of Object.entries(descMap)) {
      if (name.includes(key)) return info;
    }
    return { desc: `${mediaType === "image" ? "画像" : "動画"}生成AIモデル`, bestFor: "高品質コンテンツ生成" };
  }

  return sorted.map(([name, { elo, url }], i) => {
    const info = getMediaInfo(name);
    return {
      rank: i + 1,
      toolName: name,
      description: info.desc,
      bestFor: info.bestFor,
      url: `${baseUrl}${url}`,
      score: `ELO: ${elo.toFixed(0)}`,
    };
  });
}

/** Fetch and parse Artificial Analysis rankings directly from HTML */
async function fetchArtificialAnalysisRankings(): Promise<Array<{
  category: string;
  tools: Array<{
    rank: number;
    toolName: string;
    description: string;
    bestFor: string;
    url: string;
    score?: string;
  }>;
}>> {
  let html = "";
  try {
    const res = await fetch("https://artificialanalysis.ai/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ViewCore/1.0)" },
    });
    if (res.ok) html = await res.text();
  } catch {
    html = "";
  }

  if (!html) {
    // Fallback: LLM-generated rankings
    return generateFallbackRankings();
  }

  const baseUrl = "https://artificialanalysis.ai";

  // Parse each ranking category
  const intelligenceModels = parseAaDataBlock(html, "intelligenceIndex")
    .sort((a, b) => (b.intelligenceIndex ?? 0) - (a.intelligenceIndex ?? 0))
    .slice(0, 5);

  const speedModels = parseAaDataBlock(html, "medianOutputSpeed")
    .sort((a, b) => (b.medianOutputSpeed ?? 0) - (a.medianOutputSpeed ?? 0))
    .slice(0, 5);

  const priceModels = parseAaDataBlock(html, "pricePerMillionTokens")
    .sort((a, b) => (a.pricePerMillionTokens ?? 999) - (b.pricePerMillionTokens ?? 999))
    .slice(0, 5);

  // Model descriptions (best-effort mapping)
  const modelDescriptions: Record<string, { desc: string; bestFor: string }> = {
    "Gemini": { desc: "Googleの最新マルチモーダルLLM", bestFor: "複雑な推論・コード生成" },
    "GPT": { desc: "OpenAIの最新GPTモデル", bestFor: "汎用タスク・文章生成" },
    "Claude": { desc: "Anthropicの安全性重視LLM", bestFor: "長文分析・コンテンツ生成" },
    "Grok": { desc: "xAIのリアルタイム情報対応LLM", bestFor: "最新情報・X連携タスク" },
    "DeepSeek": { desc: "中国発の高コスパオープンLLM", bestFor: "コード生成・数学推論" },
    "Llama": { desc: "Metaのオープンソースモデル", bestFor: "ローカル実行・カスタマイズ" },
    "Mistral": { desc: "欧州発の軽量高性能LLM", bestFor: "高速処理・コスト削減" },
    "NVIDIA": { desc: "NVIDIA製の高速推論LLM", bestFor: "エンタープライズ向け" },
    "GLM": { desc: "清華大学発の中国語対応LLM", bestFor: "中国語処理・多言語対応" },
    "Muse": { desc: "新世代クリエイティブLLM", bestFor: "創作・アイデア生成" },
    "gpt-oss": { desc: "OpenAIのオープンソース系モデル", bestFor: "高速処理・低コスト" },
  };

  function getModelInfo(name: string): { desc: string; bestFor: string } {
    for (const [key, info] of Object.entries(modelDescriptions)) {
      if (name.includes(key)) return info;
    }
    return { desc: "高性能AIモデル", bestFor: "汎用タスク" };
  }

  const toToolList = (
    models: AaModel[],
    scoreField: keyof AaModel,
    scoreLabel: string,
    scoreUnit: string
  ) =>
    models.map((m, i) => {
      const info = getModelInfo(m.modelName);
      const scoreVal = m[scoreField] as number | undefined;
      const scoreStr = scoreVal !== undefined
        ? `${scoreLabel}: ${scoreVal.toFixed(scoreField === "pricePerMillionTokens" ? 4 : 1)}${scoreUnit}`
        : undefined;
      return {
        rank: i + 1,
        toolName: m.modelName,
        description: info.desc,
        bestFor: info.bestFor,
        url: m.detailsUrl ? `${baseUrl}${m.detailsUrl}` : baseUrl,
        score: scoreStr,
      };
    });

  const rankings = [];

  if (intelligenceModels.length > 0) {
    rankings.push({
      category: "🧠 LLM知性ランキング（Intelligence Index）",
      tools: toToolList(intelligenceModels, "intelligenceIndex", "知性指数", ""),
    });
  }

  if (speedModels.length > 0) {
    rankings.push({
      category: "⚡ LLMスピードランキング（Output Speed）",
      tools: toToolList(speedModels, "medianOutputSpeed", "速度", " tok/s"),
    });
  }

  if (priceModels.length > 0) {
    rankings.push({
      category: "💰 LLMコスパランキング（Price/M tokens）",
      tools: toToolList(priceModels, "pricePerMillionTokens", "価格", "$/M"),
    });
  }

  // Fetch image and video rankings from dedicated pages
  const [imageModels, videoModels] = await Promise.all([
    fetchAaMediaRankings("image"),
    fetchAaMediaRankings("video"),
  ]);

  if (imageModels.length > 0) {
    rankings.push({
      category: "🖼️ 画像生成ランキング（ELOスコア）",
      tools: imageModels,
    });
  }

  if (videoModels.length > 0) {
    rankings.push({
      category: "🎬 動画生成ランキング（ELOスコア）",
      tools: videoModels,
    });
  }

  // If we couldn't parse enough data, supplement with LLM
  if (rankings.length < 2) {
    return generateFallbackRankings();
  }

  return rankings;
}

/** Fallback: generate rankings using LLM when scraping fails */
async function generateFallbackRankings(): Promise<Array<{
  category: string;
  tools: Array<{
    rank: number;
    toolName: string;
    description: string;
    bestFor: string;
    url: string;
    score?: string;
  }>;
}>> {
  const today = new Date().toISOString().split("T")[0];
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `あなたはAI業界のアナリストです。${today}時点の最新AIモデルランキングを日本語でまとめてください。
必ず以下のJSON配列形式で返してください（他のテキストは不要）:
[{
  "category": "カテゴリ名（日本語）",
  "tools": [
    {
      "rank": 1,
      "toolName": "ツール名",
      "description": "特徴・得意なこと（60文字以内）",
      "bestFor": "最適な用途（30文字以内）",
      "url": "公式サイトURL",
      "score": "スコアや評価"
    }
  ]
}]
以下のカテゴリを含めてください:
1. LLM知性ランキング（上位5モデル）
2. LLMスピードランキング（上位5モデル）
3. LLMコスパランキング（上位5モデル）
4. 画像生成ランキング（上位5モデル）
5. 動画生成ランキング（上位5モデル）`,
      },
      {
        role: "user",
        content: `${today}時点の最新AIモデルランキングを教えてください。Artificial Analysis (artificialanalysis.ai) のデータを参考に、各カテゴリ上位5モデルをまとめてください。`,
      },
    ],
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content as string);
    return Array.isArray(parsed) ? parsed : (parsed.rankings ?? parsed.categories ?? []);
  } catch {
    return [];
  }
}

// ─── Video AI Tools ───────────────────────────────────────────────────────────

/** Generate video AI tools info using LLM */
async function generateVideoAiTools(today: string): Promise<unknown[]> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `あなたはYouTube動画制作に特化したAIツールの専門家です。必ず以下のJSON配列形式で返してください（他のテキストは不要）: [{"toolName":"ツール名","category":"カテゴリ（動画生成/動画編集/サムネイル/BGM/字幕/エフェクト）","description":"ツールの概要（50文字以内）","useCases":["活用事例1","活用事例2","活用事例3"],"tips":"YouTuberへのアドバイス（100文字以内）","url":"公式サイトURL","pricing":"無料/有料/フリーミアム"}]`,
      },
      {
        role: "user",
        content: `${today}時点でのYouTube動画制作に使えるAIツールを教えてください。Kling AI、DomoAI、Veo3、Runway、Pika、Sora、ElevenLabs、Midjourney、CapCut AI、Topaz Video AIを含めてください。各ツールの活用事例とYouTuberへのアドバイスを含めてください。`,
      },
    ],
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content as string);
    return Array.isArray(parsed) ? parsed : (parsed.tools ?? parsed.videoTools ?? []);
  } catch {
    return [];
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const aiInfoRouter = router({
  /**
   * Get the latest AI daily report from DB.
   */
  getLatestReport: publicProcedure.query(async () => {
    const report = await getLatestAiDailyReport();
    if (!report) return null;

    return {
      reportDate: report.reportDate,
      generatedAt: report.generatedAt,
      latestNews: report.latestNews ? JSON.parse(report.latestNews) : [],
      toolRankings: report.toolRankings ? JSON.parse(report.toolRankings) : [],
      videoAiTools: report.videoAiTools ? JSON.parse(report.videoAiTools) : [],
    };
  }),

  /**
   * Verify admin password for generating reports manually.
   */
  verifyAdminPassword: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input }) => {
      const expectedPassword = process.env.ADMIN_GENERATE_PASSWORD;
      if (!expectedPassword) return { valid: false };
      return { valid: input.password === expectedPassword };
    }),

  /**
   * Generate a fresh AI daily report.
   * - News: real articles from ai-gallery.jp (WordPress REST API)
   * - Rankings: directly parsed from Artificial Analysis HTML
   * - Video tools: LLM-generated with latest knowledge
   */
  generateReport: publicProcedure.mutation(async () => {
    const today = new Date().toISOString().split("T")[0];

    // Run all three in parallel
    const [latestNews, toolRankings, videoAiTools] = await Promise.all([
      fetchAiGalleryNews(),
      fetchArtificialAnalysisRankings(),
      generateVideoAiTools(today),
    ]);

    // Save to DB
    await upsertAiDailyReport({
      reportDate: new Date(today),
      latestNews: JSON.stringify(latestNews),
      toolRankings: JSON.stringify(toolRankings),
      videoAiTools: JSON.stringify(videoAiTools),
      generatedAt: new Date(),
    });

    return {
      success: true,
      reportDate: today,
      newsCount: latestNews.length,
      rankingCategories: toolRankings.length,
      videoToolsCount: videoAiTools.length,
    };
  }),
});
