"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  filterAndSortAdminPosts,
  type PostSortOrder,
  type StatusFilter,
} from "@/lib/admin-posts";
import type { Post } from "@/lib/types";

export function AdminPostTable({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] =
    useState<PostSortOrder>("draft-newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visiblePosts = useMemo(() => {
    return filterAndSortAdminPosts(posts, statusFilter, sortOrder);
  }, [posts, sortOrder, statusFilter]);

  async function handleDelete(post: Post) {
    const confirmed = window.confirm(
      `Delete "${post.title}" permanently? This also removes its stored PDF. This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(post.id);
    setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete article");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete article");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="admin-filters">
        <div className="field">
          <label className="field__label" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            className="select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft only</option>
            <option value="published">Published only</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="sort-order">
            Sort
          </label>
          <select
            id="sort-order"
            className="select"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value as PostSortOrder)
            }
          >
            <option value="draft-newest">Drafts first, newest first</option>
            <option value="published-newest">
              Published first, newest first
            </option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Source</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visiblePosts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                  No articles match this status.
                </td>
              </tr>
            ) : (
              visiblePosts.map((post) => (
                <tr key={post.id}>
                  <td style={{ fontWeight: 600 }}>{post.title}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {post.subjectName}
                  </td>
                  <td
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {post.sourceMessageId ? (
                      <span title={post.sourceFrom}>From email</span>
                    ) : (
                      "Manual"
                    )}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {new Date(post.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td>
                    <span
                      className={
                        post.status === "published"
                          ? "status status--published"
                          : "status status--draft"
                      }
                    >
                      {post.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="link-arrow"
                      >
                        Edit
                      </Link>
                      {post.status === "draft" && (
                        <button
                          type="button"
                          className="button-link button-link--danger"
                          disabled={deletingId === post.id}
                          onClick={() => handleDelete(post)}
                        >
                          {deletingId === post.id ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
