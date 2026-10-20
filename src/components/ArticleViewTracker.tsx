"use client";

import { useEffect } from "react";

export function ArticleViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    void fetch("/api/usage/article-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {
      // Analytics must never interfere with reading an article.
    });
  }, [postId]);

  return null;
}

