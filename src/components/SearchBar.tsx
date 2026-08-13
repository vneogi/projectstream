"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({
  initialQuery = "",
  large = false,
}: {
  initialQuery?: string;
  large?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label className="sr-only" htmlFor="site-search">Search articles</label>
      <div className={`flex gap-2 ${large ? "flex-col sm:flex-row" : ""}`}>
        <input
          id="site-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search physics, coding, class 10, experiments…"
          className={`w-full border border-steam-deep/20 bg-white/80 px-4 text-steam-ink placeholder:text-steam-muted/60 focus:border-steam-mid focus:outline-none focus:ring-2 focus:ring-steam-sky/30 ${
            large ? "py-3 text-base" : "py-2 text-sm"
          }`}
        />
        <button
          type="submit"
          className={`bg-steam-warm font-medium text-white transition hover:bg-steam-deep ${
            large ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}
