"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Icon } from "@/components/Icon";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/safe-path";

// Inlined at build time by Next.js — a redeploy is required after changing them in Vercel.
const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeInternalPath(searchParams.get("next"));
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const missingVars = [
    hasUrl ? null : "NEXT_PUBLIC_SUPABASE_URL",
    hasAnonKey ? null : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean) as string[];

  async function signIn() {
    setLoading(true);
    setLocalError("");
    trackEvent("sign_in_click", { provider: "google" });
    try {
      if (missingVars.length > 0) {
        throw new Error(
          `Student login is not configured yet. Missing in this deployment: ${missingVars.join(
            " and ",
          )}. Add it in Vercel → Settings → Environment Variables (Production), then Redeploy. See AUTH.md.`,
        );
      }
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="page-glow" />
      <div className="container" style={{ maxWidth: "480px" }}>
        <span className="section__eyebrow">Student access</span>
        <h1 className="section__title">Sign in to download</h1>
        <p className="section__lead">
          Browse summaries, search, and Ask AI are free for everyone. Sign in
          with Google to download original files and read the full notes.
        </p>

        <div className="panel form">
          {missingVars.length > 0 && (
            <p className="alert alert--error">
              Setup incomplete — this deployment was built without{" "}
              {missingVars.join(" and ")}. Add the variable(s) in Vercel for the
              Production environment, then redeploy.
            </p>
          )}

          {(error || localError) && (
            <p className="alert alert--error" role="alert">
              {localError || "Sign-in did not complete. Please try again."}
            </p>
          )}

          <button
            type="button"
            className="btn btn--primary btn--full"
            disabled={loading}
            onClick={() => signIn()}
          >
            {loading ? "Redirecting…" : "Continue with Google"}
            <Icon name="arrow-right" />
          </button>

          <p className="field__hint" style={{ textAlign: "center" }}>
            Google is the sign-in we offer because almost every student already
            has a Gmail or school Google account. We only use it to confirm you
            are a real person. We do not post on your behalf.
          </p>
        </div>

        <p style={{ marginTop: "24px" }}>
          <Link href="/" className="link-arrow">
            Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<section className="section"><div className="container"><p>Loading…</p></div></section>}>
      <LoginForm />
    </Suspense>
  );
}
