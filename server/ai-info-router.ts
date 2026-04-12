import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getLatestAiDailyReport, upsertAiDailyReport, getInfoSources, addInfoSource, updateInfoSourceMemo, deleteInfoSource, seedDefaultInfoSources } from "./db";
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

/**
 * Parse all model data from Artificial Analysis main page.
 * Extracts from the escaped JSON in script tags (self.__next_f.push format).
 * Returns models with: name, url, intelligence, speed, price, omniscience, gdpval, openness, coding, agentic
 */
async function fetchAaAllModels(): Promise<Array<{
  name: string;
  url: string;
  intelligence?: number;
  speed?: number;
  price?: number;
  omniscience?: number;
  gdpval?: number;
  openness?: number;
  coding?: number;
  agentic?: number;
}>> {
  let html = "";
  try {
    const res = await fetch("https://artificialanalysis.ai/", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    if (res.ok) html = await res.text();
  } catch {
    return [];
  }

  if (!html || html.length < 100000) return [];

  // Find the script tag containing model data with safeGdpval
  // The data is in escaped JSON format inside self.__next_f.push([1,"..."])
  const scriptMatches = [...html.matchAll(/<script[^>]*>(self\.__next_f\.push\(.*?\))<\/script>/gs)];
  let targetScript = "";
  for (const match of scriptMatches) {
    if (match[1].includes('safeGdpval') && match[1].length > 50000) {
      targetScript = match[1];
      break;
    }
  }

  if (!targetScript) return [];

  // Find all model entries by their id pattern
  const idPositions: number[] = [];
  const idPattern = /\{\\"id\\":\\"[0-9a-f-]{36}\\"/g;
  let m: RegExpExecArray | null;
  while ((m = idPattern.exec(targetScript)) !== null) {
    idPositions.push(m.index);
  }

  if (idPositions.length === 0) return [];

  const models: Array<{
    name: string;
    url: string;
    intelligence?: number;
    speed?: number;
    price?: number;
    omniscience?: number;
    gdpval?: number;
    openness?: number;
    coding?: number;
    agentic?: number;
  }> = [];

  const baseUrl = "https://artificialanalysis.ai";

  for (let i = 0; i < idPositions.length; i++) {
    const start = idPositions[i];
    const end = i + 1 < idPositions.length ? idPositions[i + 1] : start + 5000;
    const entry = targetScript.substring(start, end);

    // Extract short_name (model name)
    const nameMatch = /\\"short_name\\":\\"([^\\"]+)\\"/.exec(entry);
    if (!nameMatch) continue;
    const name = nameMatch[1];

    // Extract model_url
    const urlMatch = /\\"model_url\\":\\"([^\\"]+)\\"/.exec(entry);
    const modelUrl = urlMatch ? urlMatch[1] : null;

    // Extract numeric fields
    const extract = (pattern: RegExp): number | undefined => {
      const m = pattern.exec(entry);
      return m ? parseFloat(m[1]) : undefined;
    };

    const intelligence = extract(/\\"intelligence_index\\":([-\d.]+)/);
    const speed = extract(/\\"median_output_speed\\":([-\d.]+)/);
    const price = extract(/\\"price_1m_blended_3_to_1\\":([-\d.]+)/);
    const omniscience = extract(/\\"omniscience\\":([-\d.]+)/);
    const gdpval = extract(/\\"safeGdpval\\":\{\\"elo\\":([-\d.]+)/);
    const openness = extract(/\\"opennessIndex\\":([-\d.]+)/);
    const coding = extract(/\\"coding_index\\":([-\d.]+)/);
    const agentic = extract(/\\"agentic_index\\":([-\d.]+)/);

    models.push({
      name,
      url: modelUrl ? `${baseUrl}${modelUrl}` : baseUrl,
      intelligence,
      speed,
      price,
      omniscience,
      gdpval,
      openness,
      coding,
      agentic,
    });
  }

  return models;
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
    "MiniMax": { desc: "MiniMaxの高性能マルチモーダルLLM", bestFor: "マルチモーダル・長文処理" },
    "Qwen": { desc: "Alibabaの多言語対応LLM", bestFor: "多言語処理・コード生成" },
    "Kimi": { desc: "Moonshot AIの長コンテキストLLM", bestFor: "超長文処理・文書分析" },
    "K2": { desc: "MBZUAI発のオープンソースLLM", bestFor: "研究・オープン利用" },
    "Nemotron": { desc: "NVIDIA製の高性能推論LLM", bestFor: "エンタープライズ・高速処理" },
    "MiMo": { desc: "Xiaomi発の軽量高性能LLM", bestFor: "モバイル・エッジ推論" },
    "Gemma": { desc: "Googleのオープンソース軽量LLM", bestFor: "ローカル実行・研究" },
    "Solar": { desc: "Upstage発の高性能LLM", bestFor: "企業向け・文書処理" },
    "EXAONE": { desc: "LG AI Research発のLLM", bestFor: "韓国語・多言語処理" },
  };

  function getModelInfo(name: string): { desc: string; bestFor: string } {
    for (const [key, info] of Object.entries(modelDescriptions)) {
      if (name.includes(key)) return info;
    }
    return { desc: "高性能AIモデル", bestFor: "汎用タスク" };
  }

  type ToolEntry = {
    rank: number;
    toolName: string;
    description: string;
    bestFor: string;
    url: string;
    score?: string;
  };

  const toToolList = (
    models: Array<{ name: string; url: string; [key: string]: unknown }>,
    scoreField: string,
    scoreLabel: string,
    scoreUnit: string,
    ascending = false,
    decimalPlaces = 1
  ): ToolEntry[] =>
    models.map((m, i) => {
      const info = getModelInfo(m.name);
      const scoreVal = m[scoreField] as number | undefined;
      const scoreStr = scoreVal !== undefined
        ? `${scoreLabel}: ${scoreVal.toFixed(decimalPlaces)}${scoreUnit}`
        : undefined;
      return {
        rank: i + 1,
        toolName: m.name,
        description: info.desc,
        bestFor: info.bestFor,
        url: m.url as string,
        score: scoreStr,
      };
    });

  const rankings: Array<{ category: string; tools: ToolEntry[] }> = [];

  // Fetch all model data and media rankings in parallel
  const [allModels, imageModels, videoModels] = await Promise.all([
    fetchAaAllModels(),
    fetchAaMediaRankings("image"),
    fetchAaMediaRankings("video"),
  ]);

  if (allModels.length > 0) {
    // 1. 知能指数 (Intelligence Index)
    const intelligenceModels = allModels
      .filter(m => m.intelligence !== undefined && m.intelligence !== null)
      .sort((a, b) => (b.intelligence ?? 0) - (a.intelligence ?? 0))
      .slice(0, 8);
    if (intelligenceModels.length > 0) {
      rankings.push({
        category: "🧠 知能指数（Intelligence Index）",
        tools: toToolList(intelligenceModels, "intelligence", "知性指数", ""),
      });
    }

    // 2. AA-全知 (Omniscience)
    const omniscienceModels = allModels
      .filter(m => m.omniscience !== undefined && m.omniscience !== null)
      .sort((a, b) => (b.omniscience ?? -999) - (a.omniscience ?? -999))
      .slice(0, 8);
    if (omniscienceModels.length > 0) {
      rankings.push({
        category: "🌐 AA-全知（Omniscience Index）",
        tools: toToolList(omniscienceModels, "omniscience", "全知指数", ""),
      });
    }

    // 3. GDPval-AA
    const gdpvalModels = allModels
      .filter(m => m.gdpval !== undefined && m.gdpval !== null)
      .sort((a, b) => (b.gdpval ?? 0) - (a.gdpval ?? 0))
      .slice(0, 8);
    if (gdpvalModels.length > 0) {
      rankings.push({
        category: "🏆 GDPval-AA（経済価値スコア）",
        tools: toToolList(gdpvalModels, "gdpval", "ELO", "", false, 0),
      });
    }

    // 4. 開放性指数 (Openness Index)
    const opennessModels = allModels
      .filter(m => m.openness !== undefined && m.openness !== null)
      .sort((a, b) => (b.openness ?? 0) - (a.openness ?? 0))
      .slice(0, 8);
    if (opennessModels.length > 0) {
      rankings.push({
        category: "🔓 開放性指数（Openness Index）",
        tools: toToolList(opennessModels, "openness", "開放性", ""),
      });
    }

    // 5. 情報分析 - コーディング指数 (Coding Index)
    const codingModels = allModels
      .filter(m => m.coding !== undefined && m.coding !== null)
      .sort((a, b) => (b.coding ?? 0) - (a.coding ?? 0))
      .slice(0, 8);
    if (codingModels.length > 0) {
      rankings.push({
        category: "💻 情報分析・コーディング指数（Coding Index）",
        tools: toToolList(codingModels, "coding", "コーディング指数", ""),
      });
    }

    // 6. エージェント指数 (Agentic Index)
    const agenticModels = allModels
      .filter(m => m.agentic !== undefined && m.agentic !== null)
      .sort((a, b) => (b.agentic ?? 0) - (a.agentic ?? 0))
      .slice(0, 8);
    if (agenticModels.length > 0) {
      rankings.push({
        category: "🤖 エージェント指数（Agentic Index）",
        tools: toToolList(agenticModels, "agentic", "エージェント指数", ""),
      });
    }

    // 7. 出力トークン速度 (Speed)
    const speedModels = allModels
      .filter(m => m.speed !== undefined && m.speed !== null && (m.speed ?? 0) > 0)
      .sort((a, b) => (b.speed ?? 0) - (a.speed ?? 0))
      .slice(0, 8);
    if (speedModels.length > 0) {
      rankings.push({
        category: "⚡ 速度と遅延（Output Speed）",
        tools: toToolList(speedModels, "speed", "速度", " tok/s", false, 0),
      });
    }

    // 8. コスト効率・価格 (Price)
    const priceModels = allModels
      .filter(m => m.price !== undefined && m.price !== null && (m.price ?? 0) > 0)
      .sort((a, b) => (a.price ?? 999) - (b.price ?? 999))
      .slice(0, 8);
    if (priceModels.length > 0) {
      rankings.push({
        category: "💰 価格・コスト効率（Price per 1M tokens）",
        tools: toToolList(priceModels, "price", "価格", "$/M", true, 4),
      });
    }
  }

  // 9. 画像生成ランキング
  if (imageModels.length > 0) {
    rankings.push({
      category: "🖼️ 画像生成ランキング（ELOスコア）",
      tools: imageModels,
    });
  }

  // 10. 動画生成ランキング
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

// ─── Ledge.ai News ───────────────────────────────────────────────────────────

/** Fetch latest AI news from ledge.ai by scraping HTML */
async function fetchLedgeAiNews(): Promise<Array<{
  title: string;
  url: string;
  publishedAt: string;
}>> {
  let html = "";
  try {
    const res = await fetch("https://ledge.ai/", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    if (res.ok) html = await res.text();
  } catch {
    return [];
  }

  if (!html || html.length < 50000) return [];

  // Pattern: date div -> article link with alt text as title
  // Using new RegExp to avoid issues with non-ASCII in regex literals
  const thumbnailSuffix = "\u306e\u30b5\u30e0\u30cd\u30a4\u30eb\u753b\u50cf"; // のサムネイル画像
  const patternStr = String.raw`(\d{4})<span>/<\/span>(\d{1,2})<span>/<\/span>(\d{1,2})[\s\S]{0,500}?href="(\/articles\/([^"]+))"[\s\S]{0,500}?alt="([^"]+?)(?:${thumbnailSuffix})?"`;
  const pattern = new RegExp(patternStr, "g");

  const articles: Array<{ title: string; url: string; publishedAt: string }> = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(html)) !== null) {
    const [, year, month, day, urlPath, slug, title] = m;
    if (seen.has(slug)) continue;
    seen.add(slug);
    articles.push({
      title,
      url: "https://ledge.ai" + urlPath,
      publishedAt: year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0"),
    });
    if (articles.length >= 20) break;
  }

  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
      ledgeNews: report.ledgeNews ? JSON.parse(report.ledgeNews) : [],
    };
  }),

  /** Get all info sources */
  getInfoSources: publicProcedure.query(async () => {
    // Seed defaults if empty
    await seedDefaultInfoSources();
    return getInfoSources();
  }),

  /** Add a new info source */
  addInfoSource: publicProcedure
    .input(z.object({
      category: z.enum(["youtube", "x", "website"]),
      title: z.string().min(1).max(255),
      url: z.string().url(),
      memo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return addInfoSource(input);
    }),

  /** Update memo for an info source */
  updateInfoSourceMemo: publicProcedure
    .input(z.object({
      id: z.number(),
      memo: z.string(),
    }))
    .mutation(async ({ input }) => {
      return updateInfoSourceMemo(input.id, input.memo);
    }),

  /** Delete an info source */
  deleteInfoSource: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteInfoSource(input.id);
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

    // Run all four in parallel
    const [latestNews, toolRankings, videoAiTools, ledgeNews] = await Promise.all([
      fetchAiGalleryNews(),
      fetchArtificialAnalysisRankings(),
      generateVideoAiTools(today),
      fetchLedgeAiNews(),
    ]);

    // Save to DB
    await upsertAiDailyReport({
      reportDate: new Date(today),
      latestNews: JSON.stringify(latestNews),
      toolRankings: JSON.stringify(toolRankings),
      videoAiTools: JSON.stringify(videoAiTools),
      ledgeNews: JSON.stringify(ledgeNews),
      generatedAt: new Date(),
    });

    return {
      success: true,
      reportDate: today,
      newsCount: latestNews.length,
      rankingCategories: toolRankings.length,
      videoToolsCount: videoAiTools.length,
      ledgeNewsCount: ledgeNews.length,
    };
  }),
});
