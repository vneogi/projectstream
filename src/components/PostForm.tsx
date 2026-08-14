"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import type { Post, PostStatus, Subject } from "@/lib/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PostForm({
  subjects,
  post,
}: {
  subjects: Subject[];
  post?: Post;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [subjectSlug, setSubjectSlug] = useState(
    post?.subjectSlug ?? subjects[0]?.slug ?? "",
  );
  const [topics, setTopics] = useState(post?.topics.join(", ") ?? "");
  const [authorName, setAuthorName] = useState(post?.authorName ?? "");
  const [authorSchool, setAuthorSchool] = useState(post?.authorSchool ?? "");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!post) setSlug(slugify(value));
  }

  async function handleEnrich() {
    setEnriching(true);
    setError("");
    try {
      const res = await fetch("/api/admin/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Auto-fill failed");

      if (data.title) handleTitleChange(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.content) setContent(data.content);
      if (data.subjectSlug) setSubjectSlug(data.subjectSlug);
      if (Array.isArray(data.topics)) setTopics(data.topics.join(", "));
      if (data.authorName) setAuthorName(data.authorName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-fill failed");
    } finally {
      setEnriching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title,
      slug,
      excerpt,
      content,
      subjectSlug,
      topics: topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      authorName,
      authorSchool: authorSchool || undefined,
      language: "en",
      status,
    };

    const url = post ? `/api/posts/${post.id}` : "/api/posts";
    const method = post ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel form">
      <div className="field">
        <label className="field__label" htmlFor="content">
          Content (paste email body / notes first)
        </label>
        <p className="field__hint">
          Separate paragraphs with a blank line. Then use Auto-fill to generate
          title, summary, subject, and topics.
        </p>
        <textarea
          id="content"
          className="textarea textarea--mono"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          required
        />
      </div>

      <div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleEnrich}
          disabled={enriching || content.trim().length < 40}
        >
          {enriching ? "Working…" : "Auto-fill title, summary & subject"}
          <Icon name="sparkles" />
        </button>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="input"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
        />
      </div>

      <div className="form__grid form__grid--2">
        <div className="field">
          <label className="field__label" htmlFor="slug">
            URL slug
          </label>
          <input
            id="slug"
            className="input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="subject">
            Subject
          </label>
          <select
            id="subject"
            className="select"
            value={subjectSlug}
            onChange={(e) => setSubjectSlug(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="excerpt">
          Short summary (shown on cards + used by Ask AI)
        </label>
        <textarea
          id="excerpt"
          className="textarea"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          required
        />
      </div>

      <div className="form__grid form__grid--2">
        <div className="field">
          <label className="field__label" htmlFor="topics">
            Topics
          </label>
          <input
            id="topics"
            className="input"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="algebra, class-10"
          />
          <p className="field__hint">Comma-separated.</p>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="author">
            Author name
          </label>
          <input
            id="author"
            className="input"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="school">
            School or class
          </label>
          <input
            id="school"
            className="input"
            value={authorSchool}
            onChange={(e) => setAuthorSchool(e.target.value)}
          />
          <p className="field__hint">Optional.</p>
        </div>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <div>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? "Saving…" : post ? "Update article" : "Create article"}
          <Icon name="arrow-right" />
        </button>
      </div>
    </form>
  );
}
