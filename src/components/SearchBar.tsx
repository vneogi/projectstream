"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <label className="visually-hidden" htmlFor="site-search">
        Search articles
      </label>
      <div className="search-field">
        <Icon name="search" />
        <input
          id="site-search"
          type="search"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “photosynthesis”, “quadratic equations”, “python”…"
        />
      </div>
      <button type="submit" className="btn btn--primary">
        Search
        <Icon name="arrow-right" />
      </button>
    </form>
  );
}
