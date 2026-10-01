"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";
import { trackEvent } from "@/lib/analytics";

export function LikeButton({
  postId,
  slug,
  initialCount,
  initialLiked,
  isLoggedIn,
}: {
  postId: string;
  slug: string;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <div className="like-row">
        <Link
          href={`/auth/login?next=${encodeURIComponent(`/posts/${slug}`)}`}
          className="btn btn--secondary"
        >
          Helpful? Sign in to like
          <Icon name="heart" />
        </Link>
        {count > 0 ? (
          <span className="like-row__count">
            {count} student{count === 1 ? "" : "s"} found this helpful
          </span>
        ) : null}
      </div>
    );
  }

  async function toggle() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update like");
      setLiked(Boolean(data.liked));
      setCount(Number(data.likeCount ?? 0));
      trackEvent("article_like", {
        slug,
        liked: Boolean(data.liked),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update like");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="like-row">
      <button
        type="button"
        className={liked ? "btn btn--primary" : "btn btn--secondary"}
        onClick={toggle}
        disabled={loading}
        aria-pressed={liked}
      >
        {liked ? "Liked" : "This helped"}
        <Icon name="heart" />
      </button>
      <span className="like-row__count">
        {count} like{count === 1 ? "" : "s"} — these help useful articles rise in search
      </span>
      {error ? (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
