"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export function MaterialAccess({
  postId,
  slug,
  hasFile,
  fileName,
  isLoggedIn,
}: {
  postId: string;
  slug: string;
  hasFile: boolean;
  fileName?: string;
  isLoggedIn: boolean;
}) {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user));
    });
  }, []);

  const next = `/posts/${slug}`;

  if (!hasFile) {
    return (
      <div className="panel panel--soft" style={{ marginTop: "28px" }}>
        <p className="feature__title">Original file unavailable</p>
        <p className="card__desc">
          This article does not have a downloadable original file yet.
        </p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="panel panel--soft" style={{ marginTop: "28px" }}>
        <p className="feature__title">Download original file</p>
        <p className="card__desc" style={{ marginBottom: "16px" }}>
          The article summary, Search, and Ask AI stay free. Sign in with
          Google to download {fileName || "the original file"}.
        </p>
        <Link
          href={`/auth/login?next=${encodeURIComponent(next)}`}
          className="btn btn--primary"
        >
          Sign in to continue
          <Icon name="arrow-right" />
        </Link>
      </div>
    );
  }

  return (
    <div className="panel" style={{ marginTop: "28px" }}>
      <p className="feature__title">Original file ready</p>
      <p className="card__desc" style={{ marginBottom: "16px" }}>
        You can download {fileName || "the original file"}.
      </p>
      <a
        href={`/api/download/${postId}`}
        className="btn btn--primary"
        onClick={() => trackEvent("file_download", { post_id: postId })}
      >
        Download {fileName || "file"}
        <Icon name="arrow-right" />
      </a>
    </div>
  );
}
