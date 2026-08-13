"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";

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
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container container--narrow">
        <span className="section__eyebrow">Ask AI</span>
        <h1 className="section__title">Ask Project_Steam</h1>
        <p className="section__lead">
          Answers are built from published articles in our library, with the
          sources shown so you can read further.
        </p>

        <form onSubmit={handleAsk} className="panel form">
          <div className="field">
            <label className="field__label" htmlFor="question">
              Your question
            </label>
            <textarea
              id="question"
              className="textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              required
              placeholder="e.g. How do I balance chemical equations step by step?"
            />
          </div>
          <div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !question.trim()}
            >
              {loading ? "Thinking…" : "Ask"}
              <Icon name="sparkles" />
            </button>
          </div>
        </form>

        {error && (
          <p className="alert alert--error" role="alert" style={{ marginTop: "24px" }}>
            {error}
          </p>
        )}

        {answer && (
          <div className="panel" style={{ marginTop: "24px" }}>
            <span className="card__eyebrow">
              <Icon name="sparkles" />
              Answer
            </span>
            <p className="prose" style={{ marginTop: "12px" }}>
              {answer}
            </p>

            {sources.length > 0 && (
              <div style={{ marginTop: "28px" }}>
                <p className="footer__nav-title">Sources</p>
                <div className="card-grid" style={{ marginTop: "12px" }}>
                  {sources.map((s) => (
                    <Link key={s.slug} href={`/posts/${s.slug}`} className="card">
                      <h3 className="card__title">{s.title}</h3>
                      <p className="card__desc">{s.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
