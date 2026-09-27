export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmResult = {
  content: string;
  provider: "openai" | "groq";
  model: string;
};

export type LlmOutcome =
  | ({ ok: true } & LlmResult)
  | { ok: false; errors: string[] };

/**
 * Groq retires model names periodically, so try a short list and let
 * GROQ_MODEL / OPENAI_MODEL override without a code change.
 */
const GROQ_MODELS = [
  process.env.GROQ_MODEL,
  // Llama 3.x IDs are enterprise-only on Groq as of 2026; developer keys use GPT-OSS.
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
].filter(Boolean) as string[];

const OPENAI_MODELS = [
  process.env.OPENAI_MODEL,
  "gpt-4o-mini",
].filter(Boolean) as string[];

type Provider = {
  name: "groq" | "openai";
  key?: string;
  url: string;
  models: string[];
};

async function callProvider(
  provider: Provider,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  errors: string[],
): Promise<LlmResult | null> {
  if (!provider.key) return null;

  for (const model of provider.models) {
    try {
      const payload = {
        model,
        temperature,
        max_tokens: maxTokens,
        messages,
      };
      let res = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        const needsCompletionTokens =
          res.status === 400 &&
          /max_tokens|max_completion_tokens/i.test(detail);

        if (needsCompletionTokens) {
          res = await fetch(provider.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${provider.key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              temperature,
              max_completion_tokens: maxTokens,
              messages,
            }),
          });
        }

        if (!res.ok) {
          const retryDetail = needsCompletionTokens
            ? await res.text().catch(() => detail)
            : detail;
          errors.push(
            `${provider.name}/${model}: HTTP ${res.status} ${String(retryDetail).slice(0, 200)}`,
          );
          if (res.status === 401 || res.status === 403) break;
          continue;
        }
      }

      const data = await res.json();
      const content = String(
        data.choices?.[0]?.message?.content ?? "",
      ).trim();
      if (content) return { content, provider: provider.name, model };
      errors.push(`${provider.name}/${model}: empty response`);
    } catch (err) {
      errors.push(
        `${provider.name}/${model}: ${err instanceof Error ? err.message : "request failed"}`,
      );
    }
  }

  return null;
}

/**
 * Prefer Groq (free tier, great for student projects) then OpenAI.
 * Set GROQ_API_KEY and/or OPENAI_API_KEY in Vercel env vars.
 */
export async function chatCompletionDetailed(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<LlmOutcome> {
  const temperature = options?.temperature ?? 0.3;
  const maxTokens = options?.maxTokens ?? 800;
  const errors: string[] = [];

  const providers: Provider[] = [
    {
      name: "groq",
      key: process.env.GROQ_API_KEY,
      url: "https://api.groq.com/openai/v1/chat/completions",
      models: GROQ_MODELS,
    },
    {
      name: "openai",
      key: process.env.OPENAI_API_KEY,
      url: "https://api.openai.com/v1/chat/completions",
      models: OPENAI_MODELS,
    },
  ];

  for (const provider of providers) {
    const result = await callProvider(
      provider,
      messages,
      temperature,
      maxTokens,
      errors,
    );
    if (result) return { ok: true, ...result };
  }

  if (errors.length === 0) errors.push("No GROQ_API_KEY or OPENAI_API_KEY set");
  return { ok: false, errors };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<LlmResult | null> {
  const outcome = await chatCompletionDetailed(messages, options);
  return outcome.ok
    ? {
        content: outcome.content,
        provider: outcome.provider,
        model: outcome.model,
      }
    : null;
}

export function llmConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}
