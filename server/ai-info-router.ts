import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getLatestAiDailyReport, upsertAiDailyReport } from "./db";
import { z } from "zod";

/**
 * AI Information Router
 * Collects and serves daily AI news, tool rankings, and video AI tool use cases.
 * Designed to be refreshed every morning at 7am via a scheduled job.
 */
export const aiInfoRouter = router({
  /**
   * Get the latest AI daily report from DB.
   * Returns null if no report has been generated yet.
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
   * Returns true if password matches, false otherwise.
   */
  verifyAdminPassword: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input }) => {
      const expectedPassword = process.env.ADMIN_GENERATE_PASSWORD;
      if (!expectedPassword) {
        // If no password set, deny access
        return { valid: false };
      }
      return { valid: input.password === expectedPassword };
    }),

  /**
   * Generate a fresh AI daily report using LLM.
   * This is called by the scheduled job every morning at 7am.
   */
  generateReport: publicProcedure.mutation(async () => {
    const today = new Date().toISOString().split("T")[0];

    // --- 並列でLLMを呼び出して高速化 ---
    const [newsResponse, rankingsResponse, videoToolsResponse] = await Promise.all([
      // 1. Latest AI News
      invokeLLM({
        messages: [
          {
            role: "system",
            content: `あなたはAI業界の最新情報に精通したアナリストです。今日の日付は ${today} です。AIに関する最新ニュースを5件、JSON形式で返してください。必ず以下のJSON配列形式で返してください（他のテキストは不要）: [{"title":"ニュースタイトル","summary":"100文字以内の要約","category":"カテゴリ（例: LLM/画像生成/動画AI/音声AI/ビジネス）","impact":"high/medium/low"}]`,
          },
          {
            role: "user",
            content: `${today}時点でのAI最新ニュースを5件教えてください。ChatGPT、Gemini、Claude、Grok、Sora、Kling、Veo、Runway、Midjourney等のAIツールに関するニュースを優先してください。`,
          },
        ],
        response_format: { type: "json_object" },
      }),
      // 2. AI Tool Rankings by Category
      invokeLLM({
        messages: [
          {
            role: "system",
            content: `あなたはAIツールの専門家です。各カテゴリで最も優れたAIツールをランキング形式で教えてください。必ず以下のJSON配列形式で返してください（他のテキストは不要）: [{"category":"カテゴリ名","tools":[{"rank":1,"toolName":"ツール名","description":"得意なこと・特徴（50文字以内）","bestFor":"最適なユースケース（30文字以内）","url":"公式サイトURL"}]}]`,
          },
          {
            role: "user",
            content: `以下のカテゴリで現在最強のAIツールをランキングしてください：1.リサーチ・情報収集（Manus,Perplexity,ChatGPT）2.画像生成（Midjourney,DALL-E,Gemini）3.動画生成（Kling,Veo3,Sora,Runway,DomoAI）4.スライド・資料作成（Claude,Gamma）5.文章・コピーライティング（Claude,ChatGPT）6.コーディング（Cursor,GitHub Copilot,Claude）7.音声・音楽生成（ElevenLabs,Suno,Udio）各カテゴリ上位3ツールを返してください。`,
          },
        ],
        response_format: { type: "json_object" },
      }),
      // 3. Video AI Tools Use Cases
      invokeLLM({
        messages: [
          {
            role: "system",
            content: `あなたはYouTube動画制作に特化したAIツールの専門家です。必ず以下のJSON配列形式で返してください（他のテキストは不要）: [{"toolName":"ツール名","category":"カテゴリ（動画生成/動画編集/サムネイル/BGM/字幕/エフェクト）","description":"ツールの概要（50文字以内）","useCases":["活用事例1","活用事例2","活用事例3"],"tips":"YouTuberへのアドバイス（100文字以内）","url":"公式サイトURL","pricing":"無料/有料/フリーミアム"}]`,
          },
          {
            role: "user",
            content: `YouTube動画制作に使えるAIツールを教えてください。Kling AI、DomoAI、Veo3、Runway、Pika、Sora、ElevenLabs、Midjourney、CapCut AI、Topaz Video AIを含めてください。各ツールの活用事例とYouTuberへのアドバイスを含めてください。`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    ]);

    let latestNews: unknown[] = [];
    try {
      const parsed = JSON.parse(newsResponse.choices[0].message.content as string);
      latestNews = Array.isArray(parsed) ? parsed : (parsed.news ?? parsed.items ?? []);
    } catch {
      latestNews = [];
    }

    let toolRankings: unknown[] = [];
    try {
      const parsed = JSON.parse(rankingsResponse.choices[0].message.content as string);
      toolRankings = Array.isArray(parsed) ? parsed : (parsed.rankings ?? parsed.categories ?? parsed.tools ?? []);
    } catch {
      toolRankings = [];
    }

    let videoAiTools: unknown[] = [];
    try {
      const parsed = JSON.parse(videoToolsResponse.choices[0].message.content as string);
      videoAiTools = Array.isArray(parsed) ? parsed : (parsed.tools ?? parsed.videoTools ?? []);
    } catch {
      videoAiTools = [];
    }

    // --- Save to DB ---
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
      rankingCategories: (toolRankings as { category?: string }[]).length,
      videoToolsCount: videoAiTools.length,
    };
  }),
});
