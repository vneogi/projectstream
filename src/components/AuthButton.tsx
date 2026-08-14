"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, [configured]);

  if (!ready) return null;

  if (!configured) {
    return (
      <Link href="/auth/login" className="btn btn--secondary btn--sm nav__cta">
        Sign in
      </Link>
    );
  }

  if (user) {
    const label =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Student";
    return (
      <form action="/auth/signout" method="POST" className="nav__cta">
        <button type="submit" className="btn btn--secondary btn--sm" title={user.email ?? ""}>
          Sign out ({String(label).split(" ")[0]})
        </button>
      </form>
    );
  }

  return (
    <Link href="/auth/login" className="btn btn--secondary btn--sm nav__cta">
      Sign in
    </Link>
  );
}
