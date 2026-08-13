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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1
        className="text-4xl text-steam-deep"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Search the library
      </h1>
      <p className="mt-3 text-steam-muted">
        Find articles by keyword, subject, topic, or class level.
      </p>

      <div className="mt-8">
        <SearchBar initialQuery={query} large />
      </div>

      {query && (
        <div className="mt-12">
          <p className="text-sm text-steam-muted">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;
            {query}&rdquo;
          </p>
          {results.length === 0 ? (
            <p className="mt-6 text-steam-muted">
              Nothing matched yet. Try a broader term or{" "}
              <a href="/submit" className="text-steam-mid underline">
                submit content
              </a>{" "}
              on this topic.
            </p>
          ) : (
            <div className="mt-8 grid gap-10 sm:grid-cols-2">
              {results.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
