import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import {
  cleanSearchTopics,
  enrichSubmission,
  extractGroundedMaterial,
  inferSubjectFromText,
  parseJsonObject,
} from "../src/lib/enrich.ts";

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
    assert.equal(result.subjectSlug, "biology");
    assert.ok(result.topics.includes("photosynthesis"));
    assert.ok(!result.topics.includes("email-submission"));
    assert.ok(!result.topics.includes("from-email"));
    assert.ok(result.abstract.length > 0);
  });

  it("classifies cardiovascular study material as biology", () => {
    assert.equal(
      inferSubjectFromText(
        "The heart pumps blood through blood vessels in the cardiovascular system.",
      ),
      "biology",
    );
  });

  it("explains why AI did not run so admins are not left guessing", async () => {
    const result = await enrichSubmission(
      "Long enough student notes about refraction of light for a Class 10 project.",
    );
    assert.ok(result.warning);
    assert.match(result.warning, /GROQ_API_KEY|OPENAI_API_KEY/);
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

  it("does not summarize an email when attachment OCR failed", async () => {
    const raw = `Email subject: Submission of Quiz on Human Psychology
From: Student <student@example.com>
## Email message

I made a psychology quiz and attached it.

## Extracted files

### Attachment (pdf): quiz.pdf

Student submitted file "quiz.pdf". Little or no extractable text (photo or scanned page). Original is stored for download.`;
    const result = await enrichSubmission(raw);
    assert.equal(result.provider, null);
    assert.equal(result.subjectSlug, "psychology");
    assert.equal(result.abstract, "");
    assert.deepEqual(result.topics, []);
    assert.equal(result.extractionFailed, true);
    assert.match(result.warning ?? "", /prevent invented content/i);
    assert.doesNotMatch(result.content, /student@example\.com/);
  });
});

describe("grounded email material", () => {
  it("uses readable attachment text and excludes email metadata", () => {
    const raw = `Email subject: Biology submission
From: Student <student@example.com>
## Email message

Please approve my submission.

## Extracted files

### Attachment (pdf): cells.pdf

Cells contain organelles. The nucleus stores genetic material and mitochondria release usable energy.`;
    const grounded = extractGroundedMaterial(raw);
    assert.equal(grounded.hasReadableAttachment, true);
    assert.match(grounded.text, /nucleus stores genetic material/);
    assert.doesNotMatch(grounded.text, /student@example\.com|approve my submission/);
  });

  it("classifies declared psychology and graphic-design submissions", () => {
    assert.equal(inferSubjectFromText("A quiz on human psychology"), "psychology");
    assert.equal(
      inferSubjectFromText(
        "Executive submission under the Design/Graphic Design category with educational posters",
      ),
      "design",
    );
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

  it("parses LLM JSON and maps every card field", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      text: async () => "",
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Cell division: mitosis",
                excerpt: "A clear walkthrough of mitosis stages for Class 10.",
                abstract:
                  "This deck explains mitosis stage by stage.\n\nIt covers prophase through telophase with diagrams.",
                subjectSlug: "biology",
                topics: ["Mitosis", "Cells"],
                authorName: "Riya",
                content: "Mitosis produces two identical daughter cells.",
              }),
            },
          },
        ],
      }),
    }));

    const result = await enrichSubmission(
      "Long student notes explain mitosis and cell division for biology class. The stages run from prophase through telophase with diagrams.",
    );
    assert.equal(result.provider, "groq");
    assert.equal(result.title, "Cell division: mitosis");
    assert.equal(result.subjectSlug, "biology");
    assert.ok(result.topics.includes("mitosis"));
    assert.ok(result.topics.includes("cells"));
    assert.equal(result.authorName, "Riya");
    assert.match(result.abstract, /stage by stage/);
    assert.equal(result.warning, undefined);
  });

  it("falls back when LLM returns invalid JSON", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      text: async () => "",
      json: async () => ({
        choices: [{ message: { content: "not-json-at-all" } }],
      }),
    }));

    const result = await enrichSubmission(
      "Enough text here so we attempt enrichment before falling back to heuristics.",
    );
    assert.equal(result.provider, null);
    assert.ok(result.title.length > 0);
    assert.match(result.warning ?? "", /not valid JSON/i);
  });

  it("surfaces a decommissioned-model error instead of failing silently", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: false,
      status: 400,
      text: async () => "model has been decommissioned",
      json: async () => ({}),
    }));

    const result = await enrichSubmission(
      "Enough student text to attempt an AI summary of a physics submission.",
    );
    assert.equal(result.provider, null);
    assert.match(result.warning ?? "", /decommissioned/);
  });

  it("pulls JSON out of fences or extra prose", () => {
    const parsed = parseJsonObject(
      'Sure.\n```json\n{"title":"Chlorophyll","topics":["photosynthesis"]}\n```\n',
    );
    assert.equal(parsed?.title, "Chlorophyll");
  });

  it("drops file-type tags that are not searchable topics", () => {
    assert.deepEqual(
      cleanSearchTopics(["from-email", "pdf", "photosynthesis", "chlorophyll"]),
      ["photosynthesis", "chlorophyll"],
    );
  });

  it("rejects generated claims that are not grounded in the source", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      text: async () => "",
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Quantum computing for medical diagnosis",
                excerpt:
                  "This advanced guide uses quantum algorithms to diagnose rare diseases.",
                abstract:
                  "Students build a quantum computer and apply it to hospital diagnostics.",
                subjectSlug: "computer-science",
                topics: ["quantum computing", "medical diagnosis"],
              }),
            },
          },
        ],
      }),
    }));

    const source =
      "Plants use chlorophyll to capture sunlight. Photosynthesis converts light energy into chemical energy.";
    const result = await enrichSubmission(source);
    assert.doesNotMatch(result.title, /quantum/i);
    assert.doesNotMatch(result.excerpt, /diagnos/i);
    assert.doesNotMatch(result.abstract, /hospital/i);
    assert.ok(result.topics.includes("photosynthesis"));
    assert.ok(result.topics.includes("chlorophyll"));
    assert.ok(result.topics.includes("plant"));
    assert.ok(!result.topics.some((topic) => /quantum|medical|diagnos/.test(topic)));
  });

  it("rejects unknown subjectSlug from the model", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      text: async () => "",
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
