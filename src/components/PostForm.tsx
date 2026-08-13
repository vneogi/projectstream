"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Post, PostStatus } from "@/lib/types";
import type { Subject } from "@/lib/types";

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

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!post) setSlug(slugify(value));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="mt-2 w-full border border-steam-deep/20 px-4 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">URL slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="mt-2 w-full border border-steam-deep/20 px-4 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Subject</span>
          <select
            value={subjectSlug}
            onChange={(e) => setSubjectSlug(e.target.value)}
            className="mt-2 w-full border border-steam-deep/20 px-4 py-2"
          >
            {subjects.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Short summary</span>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          required
          className="mt-2 w-full border border-steam-deep/20 px-4 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Content</span>
        <p className="text-xs text-steam-muted">Separate paragraphs with a blank line.</p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          required
          className="mt-2 w-full border border-steam-deep/20 px-4 py-2 font-mono text-sm"
        />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Topics (comma-separated)</span>
          <input
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="algebra, class-10"
            className="mt-2 w-full border border-steam-deep/20 px-4 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className="mt-2 w-full border border-steam-deep/20 px-4 py-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Author name</span>
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
            className="mt-2 w-full border border-steam-deep/20 px-4 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">School / class (optional)</span>
          <input
            value={authorSchool}
            onChange={(e) => setAuthorSchool(e.target.value)}
            className="mt-2 w-full border border-steam-deep/20 px-4 py-2"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-steam-deep px-6 py-2.5 font-medium text-white hover:bg-steam-mid disabled:opacity-50"
      >
        {loading ? "Saving…" : post ? "Update article" : "Create article"}
      </button>
    </form>
  );
}
