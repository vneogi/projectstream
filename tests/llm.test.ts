import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { chatCompletion, llmConfigured } from "../src/lib/llm.ts";

describe("llmConfigured", () => {
  const prevG = process.env.GROQ_API_KEY;
  const prevO = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (prevG === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = prevG;
    if (prevO === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevO;
  });

  it("is false with no keys", () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
    assert.equal(llmConfigured(), false);
  });

  it("is true when Groq is set", () => {
    delete process.env.OPENAI_API_KEY;
    process.env.GROQ_API_KEY = "g";
    assert.equal(llmConfigured(), true);
  });

  it("is true when OpenAI is set", () => {
    delete process.env.GROQ_API_KEY;
    process.env.OPENAI_API_KEY = "o";
    assert.equal(llmConfigured(), true);
  });
});

describe("chatCompletion", () => {
  const prevG = process.env.GROQ_API_KEY;
  const prevO = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    mock.restoreAll();
    if (prevG === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = prevG;
    if (prevO === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevO;
  });

  it("returns null when no providers are configured", async () => {
    const result = await chatCompletion([
      { role: "user", content: "hello" },
    ]);
    assert.equal(result, null);
  });

  it("prefers Groq when available", async () => {
    process.env.GROQ_API_KEY = "groq-key";
    process.env.OPENAI_API_KEY = "openai-key";

    mock.method(globalThis, "fetch", async (url: string | URL) => {
      const href = String(url);
      assert.match(href, /groq\.com/);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "  Groq answer  " } }],
        }),
      };
    });

    const result = await chatCompletion([
      { role: "user", content: "What is gravity?" },
    ]);
    assert.deepEqual(result, { content: "Groq answer", provider: "groq" });
  });

  it("falls back to OpenAI if Groq fails", async () => {
    process.env.GROQ_API_KEY = "groq-key";
    process.env.OPENAI_API_KEY = "openai-key";

    mock.method(globalThis, "fetch", async (url: string | URL) => {
      const href = String(url);
      if (href.includes("groq.com")) {
        return { ok: false, json: async () => ({}) };
      }
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "OpenAI answer" } }],
        }),
      };
    });

    const result = await chatCompletion([
      { role: "user", content: "What is gravity?" },
    ]);
    assert.deepEqual(result, {
      content: "OpenAI answer",
      provider: "openai",
    });
  });
});
