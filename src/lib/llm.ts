type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type LlmResult = {
  content: string;
  provider: "openai" | "groq";
};

/**
 * Prefer Groq (free tier, great for student projects) then OpenAI.
 * Set GROQ_API_KEY and/or OPENAI_API_KEY in Vercel env vars.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<LlmResult | null> {
  const temperature = options?.temperature ?? 0.3;
  const maxTokens = options?.maxTokens ?? 800;

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            temperature,
            max_tokens: maxTokens,
            messages,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return { content, provider: "groq" };
      }
    } catch {
      // try OpenAI next
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature,
          max_tokens: maxTokens,
          messages,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return { content, provider: "openai" };
      }
    } catch {
      // fall through
    }
  }

  return null;
}

export function llmConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}
