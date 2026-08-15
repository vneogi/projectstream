import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import { enrichSubmission } from "../src/lib/enrich.ts";

describe("enrichSubmission (fallback, no LLM)", () => {
  const prevGroq = process.env.GROQ_API_KEY;
  const prevOpenAI = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (prevGroq === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = prevGroq;
    if (prevOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevOpenAI;
  });

  it("uses first line as title for short-enough submissions", async () => {
    const raw =
      "Photosynthesis basics for Class 10\n" +
      "Plants convert light into chemical energy using chlorophyll.";
    const result = await enrichSubmission(raw);
    assert.equal(result.provider, null);
    assert.match(result.title, /Photosynthesis/i);
    assert.ok(result.excerpt.length > 0);
    assert.ok(result.excerpt.length <= 220);
    assert.equal(result.subjectSlug, "general-stem");
    assert.ok(result.topics.includes("email-submission"));
  });

  it("honours subjectHint when provided", async () => {
    const raw =
      "Ohm's law explained with circuit diagrams and sample problems for board exams.";
    const result = await enrichSubmission(raw, { subjectHint: "physics" });
    assert.equal(result.subjectSlug, "physics");
  });

  it("uses fromName when LLM is offline", async () => {
    const raw =
      "Quadratic equations step by step with examples from CBSE sample papers.";
    const result = await enrichSubmission(raw, { fromName: "Aanya" });
    assert.equal(result.authorName, "Aanya");
  });

  it("still returns a draft-friendly result for tiny bodies", async () => {
    const result = await enrichSubmission("hi");
    assert.equal(result.provider, null);
    assert.ok(result.title.length > 0);
    assert.ok(result.content.includes("hi") || result.content === "hi");
  });
});

describe("enrichSubmission (LLM JSON parse)", () => {
  const prevGroq = process.env.GROQ_API_KEY;

  beforeEach(() => {
    process.env.GROQ_API_KEY = "fake-key-for-tests";
  });

  afterEach(() => {
    mock.restoreAll();
    if (prevGroq === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = prevGroq;
  });

  it("parses LLM JSON and maps a valid subject", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Cell division: mitosis",
                excerpt: "A clear walkthrough of mitosis stages for Class 10.",
                subjectSlug: "biology",
                topics: ["mitosis", "cells"],
                authorName: "Riya",
                content: "Mitosis produces two identical daughter cells.",
              }),
            },
          },
        ],
      }),
    }));

    const result = await enrichSubmission(
      "Long enough student notes about mitosis and cell division for biology class.",
    );
    assert.equal(result.provider, "groq");
    assert.equal(result.title, "Cell division: mitosis");
    assert.equal(result.subjectSlug, "biology");
    assert.deepEqual(result.topics, ["mitosis", "cells"]);
    assert.equal(result.authorName, "Riya");
  });

  it("falls back when LLM returns invalid JSON", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "not-json-at-all" } }],
      }),
    }));

    const result = await enrichSubmission(
      "Enough text here so we attempt enrichment before falling back to heuristics.",
    );
    assert.equal(result.provider, null);
    assert.ok(result.title.length > 0);
  });

  it("rejects unknown subjectSlug from the model", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Mystery topic",
                excerpt: "Summary",
                subjectSlug: "astrology",
                topics: ["space"],
                authorName: "Student",
                content: "Body",
              }),
            },
          },
        ],
      }),
    }));

    const result = await enrichSubmission(
      "Enough text here about a mystery topic that should land in general STEM.",
    );
    assert.equal(result.subjectSlug, "general-stem");
  });
});
