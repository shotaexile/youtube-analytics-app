/**
 * OpenAI API helper - replaces Manus invokeLLM for Vercel deployment
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  messages: LLMMessage[];
  maxTokens?: number;
  model?: string;
  temperature?: number;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Call OpenAI Chat Completions API
 * Drop-in replacement for Manus invokeLLM
 */
export async function callOpenAI(options: LLMOptions): Promise<LLMResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model ?? "gpt-4o-mini",
      messages: options.messages,
      max_tokens: options.maxTokens ?? 1500,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json() as any;
  return {
    choices: data.choices.map((c: any) => ({
      message: {
        content: c.message?.content ?? "",
      },
    })),
  };
}
