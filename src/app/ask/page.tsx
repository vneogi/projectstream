"use client";

import { useState } from "react";
import Link from "next/link";

interface Source {
  title: string;
  slug: string;
  excerpt: string;
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setAnswer(data.answer);
      setSources(data.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="text-4xl text-steam-deep"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Ask Project_Steam
      </h1>
      <p className="mt-3 text-steam-muted">
        Answers are grounded in published articles from our library — not
        generic internet guesses.
      </p>

      <form onSubmit={handleAsk} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-steam-ink">Your question</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            required
            placeholder="e.g. How do I balance chemical equations step by step?"
            className="mt-2 w-full border border-steam-deep/20 bg-white/80 px-4 py-3 text-steam-ink focus:border-steam-mid focus:outline-none focus:ring-2 focus:ring-steam-sky/30"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="bg-steam-deep px-6 py-3 font-medium text-white transition hover:bg-steam-mid disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {error && (
        <p className="mt-6 text-sm text-red-700" role="alert">{error}</p>
      )}

      {answer && (
        <div className="mt-10 border-t border-steam-deep/10 pt-8">
          <h2
            className="text-xl text-steam-deep"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Answer
          </h2>
          <p className="mt-4 leading-relaxed text-steam-muted">{answer}</p>

          {sources.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-medium text-steam-ink">Sources</p>
              <ul className="mt-3 space-y-2">
                {sources.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/posts/${s.slug}`}
                      className="text-steam-mid hover:text-steam-deep"
                    >
                      {s.title}
                    </Link>
                    <p className="text-xs text-steam-muted">{s.excerpt}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
