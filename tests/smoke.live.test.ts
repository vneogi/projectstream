/**
 * Live smoke checks against the deployed site.
 * These validate public endpoints work end-to-end (no secrets required).
 *
 * Run: npm run test:smoke
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const BASE =
  process.env.SMOKE_BASE_URL?.replace(/\/$/, "") ||
  "https://projectstream.vercel.app";

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { Accept: "application/json,text/html" },
  });
  const text = await res.text();
  return { res, text, status: res.status };
}

async function postJson(path: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave null
  }
  return { res, text, json, status: res.status };
}

describe(`live smoke @ ${BASE}`, () => {
  it("home page loads", async () => {
    const { status, text } = await get("/");
    assert.equal(status, 200);
    assert.match(text, /Project STEAM/i);
  });

  it("browse and ask pages load", async () => {
    assert.equal((await get("/browse")).status, 200);
    assert.equal((await get("/ask")).status, 200);
    assert.equal((await get("/auth/login")).status, 200);
  });

  it("search API returns structured results without full content", async () => {
    const res = await fetch(`${BASE}/api/search?q=night`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as {
      posts: Array<Record<string, unknown>>;
      total: number;
      query: string;
    };
    assert.equal(data.query, "night");
    assert.ok(Array.isArray(data.posts));
    for (const post of data.posts) {
      assert.ok(post.title);
      assert.ok(post.slug);
      assert.ok(post.excerpt !== undefined);
      assert.equal(
        post.content,
        undefined,
        "public search must not leak full body",
      );
    }
  });

  it("Ask AI accepts a question and returns sources shape", async () => {
    const { status, json } = await postJson("/api/ask", {
      question: "What is photosynthesis?",
    });
    assert.equal(status, 200);
    const data = json as {
      answer: string;
      sources: unknown[];
      provider: string | null;
    };
    assert.ok(typeof data.answer === "string" && data.answer.length > 0);
    assert.ok(Array.isArray(data.sources));
  });

  it("Ask AI rejects empty questions", async () => {
    const { status } = await postJson("/api/ask", { question: "   " });
    assert.equal(status, 400);
  });

  it("email ingest rejects missing auth", async () => {
    const { status, json } = await postJson("/api/ingest/email", {
      messageId: "smoke-unauth",
      subject: "x",
      body: "y",
    });
    assert.equal(status, 401);
    assert.deepEqual(json, { error: "Unauthorized" });
  });

  it("email ingest GET describes the service", async () => {
    const res = await fetch(`${BASE}/api/ingest/email`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as { publishes: boolean; service: string };
    assert.equal(data.publishes, false);
    assert.match(data.service, /Project STEAM/i);
  });

  it("download API requires sign-in", async () => {
    const res = await fetch(`${BASE}/api/download/not-a-real-post`, {
      redirect: "manual",
    });
    assert.equal(res.status, 401);
    const data = (await res.json()) as { error: string };
    assert.match(data.error, /Sign in/i);
  });

  it("admin login rejects wrong password", async () => {
    const { status } = await postJson("/api/admin/login", {
      password: "definitely-wrong-password",
    });
    assert.equal(status, 401);
  });
});
