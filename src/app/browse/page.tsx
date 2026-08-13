import { PostCard } from "@/components/PostCard";
import { SubjectCard } from "@/components/SubjectCard";
import { listPublishedPosts, listSubjects } from "@/lib/data";

export const metadata = {
  title: "Browse",
};

export default async function BrowsePage() {
  const subjects = await listSubjects();
  const posts = await listPublishedPosts();

  const counts = Object.fromEntries(
    subjects.map((s) => [
      s.slug,
      posts.filter((p) => p.subjectSlug === s.slug).length,
    ]),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1
        className="text-4xl text-steam-deep"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Browse the library
      </h1>
      <p className="mt-3 max-w-2xl text-steam-muted">
        {posts.length} published articles across {subjects.length} subjects.
        Pick a subject or scroll through everything below.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            count={counts[subject.slug] ?? 0}
          />
        ))}
      </div>

      <div className="mt-16 border-t border-steam-deep/10 pt-12">
        <h2
          className="text-2xl text-steam-deep"
          style={{ fontFamily: "var(--font-display)" }}
        >
          All articles
        </h2>
        <div className="mt-8 grid gap-10 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
