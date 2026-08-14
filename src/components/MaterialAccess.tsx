"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
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

  if (!loggedIn) {
    return (
      <div className="panel panel--soft" style={{ marginTop: "28px" }}>
        <p className="feature__title">Full notes & downloads</p>
        <p className="card__desc" style={{ marginBottom: "16px" }}>
          Summaries, search, and Ask AI stay free. Sign in with Google to open
          the full notes{hasFile ? " and download the original file" : ""}.
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
      <p className="feature__title">Signed in — materials unlocked</p>
      <p className="card__desc" style={{ marginBottom: "16px" }}>
        Full notes are shown below
        {hasFile
          ? `. You can also download ${fileName || "the original file"}.`
          : ". (No PDF/PPTX was attached for this article yet.)"}
      </p>
      {hasFile && (
        <a href={`/api/download/${postId}`} className="btn btn--primary">
          Download {fileName || "file"}
          <Icon name="arrow-right" />
        </a>
      )}
    </div>
  );
}
