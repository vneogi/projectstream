import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { SearchBar } from "@/components/SearchBar";
import { searchPublishedPosts } from "@/lib/data";

export const metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchPublishedPosts(query) : [];

  return (
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container">
        <span className="section__eyebrow">Search</span>
        <h1 className="section__title">Find an explanation</h1>
        <p className="section__lead">
          Search by keyword, subject, topic, or class level.
        </p>

        <div className="panel">
          <SearchBar initialQuery={query} />
        </div>

        {query && (
          <div style={{ marginTop: "48px" }}>
            <p className="meta-row" style={{ marginBottom: "24px" }}>
              {results.length} result{results.length === 1 ? "" : "s"} for
              &ldquo;{query}&rdquo;
            </p>

            {results.length === 0 ? (
              <div className="empty-state">
                <p>
                  Nothing matched yet. Try a broader term, or{" "}
                  <Link href="/submit">share notes</Link> on this topic so the
                  next student finds them.
                </p>
              </div>
            ) : (
              <div className="card-grid card-grid--3">
                {results.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
