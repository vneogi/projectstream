"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { isWeakExtractedContent } from "@/lib/extract-text";
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
  const [abstract, setAbstract] = useState(post?.abstract ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [subjectSlug, setSubjectSlug] = useState(
    post?.subjectSlug ?? subjects[0]?.slug ?? "",
  );
  const [topics, setTopics] = useState(post?.topics.join(", ") ?? "");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileLabel, setFileLabel] = useState(post?.fileName ?? "");

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!post) setSlug(slugify(value));
  }

  async function handleEnrich() {
    setEnriching(true);
    setError("");
    setNotice("");
    setWarning("");
    try {
      const res = await fetch("/api/admin/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          subjectHint: subjectSlug || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Auto-fill failed");

      if (data.title) handleTitleChange(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.abstract) setAbstract(data.abstract);
      if (data.content) setContent(data.content);
      if (data.subjectSlug) setSubjectSlug(data.subjectSlug);
      if (Array.isArray(data.topics) && data.topics.length > 0) {
        setTopics(data.topics.join(", "));
      }

      if (data.warning) {
        setWarning(data.warning);
      } else {
        setNotice(
          `Filled by ${data.provider ?? "AI"}${data.model ? ` (${data.model})` : ""}. Review everything before publishing.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-fill failed");
    } finally {
      setEnriching(false);
    }
  }

  async function handleMaterial(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!post) {
      setError("Save this as a draft first, then come back to attach a file.");
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");
    setWarning("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/posts/${post.id}/material`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setFileLabel(data.fileName ?? file.name);
      const extracted = String(data.extractedText ?? "").trim();
      if (extracted.length >= 40) {
        setContent((current) =>
          !current.trim() || isWeakExtractedContent(current)
            ? extracted
            : `${current.trim()}\n\n${extracted}`,
        );
      }
      setNotice(data.parseNote ?? "File attached.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
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
      abstract,
      content,
      subjectSlug,
      topics: topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
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
          the subject, topics, summary, and abstract. For scanned PDFs or a
          stack of photos, attach the file below — OCR from email may fill this,
          or type a short overview and Auto-fill.
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

      <div className="field">
        <label className="field__label" htmlFor="material">
          Original file (PDF or images)
        </label>
        <p className="field__hint">
          {post
            ? "One file per article. Combine several photos into a single PDF, then upload. We attach it for student download and try to parse text."
            : "Save the draft first, then edit it to attach a PDF or image."}
        </p>
        {fileLabel ? (
          <p className="field__hint">Currently attached: {fileLabel}</p>
        ) : null}
        {post ? (
          <input
            id="material"
            type="file"
            disabled={uploading}
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.ppt,.pptx,.txt,image/*"
            onChange={handleMaterial}
          />
        ) : null}
        {uploading ? <p className="field__hint">Uploading…</p> : null}
      </div>

      <div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleEnrich}
          disabled={enriching || content.trim().length < 40}
        >
          {enriching
            ? "Reading the notes…"
            : "Auto-fill subject, topics, summary & abstract"}
          <Icon name="sparkles" />
        </button>
      </div>

      {notice && <p className="alert alert--info">{notice}</p>}
      {warning && <p className="alert alert--error">{warning}</p>}

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
        <p className="field__hint">2–3 lines.</p>
        <textarea
          id="excerpt"
          className="textarea"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          required
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="abstract">
          Abstract (shown publicly on the article page)
        </label>
        <p className="field__hint">
          10–20 lines. This is what a student reads before downloading the PDF.
        </p>
        <textarea
          id="abstract"
          className="textarea"
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          rows={10}
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
