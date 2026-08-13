import { notFound } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { getPostsBySubject, listSubjects } from "@/lib/data";

export async function generateStaticParams() {
  const subjects = await listSubjects();
  return subjects.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const subjects = await listSubjects();
  const subject = subjects.find((s) => s.slug === slug);
  return { title: subject?.name ?? "Subject" };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const subjects = await listSubjects();
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  const posts = await getPostsBySubject(slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div
        className="border-l-4 pl-4"
        style={{ borderColor: subject.color }}
      >
        <h1
          className="text-4xl text-steam-deep"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {subject.name}
        </h1>
        <p className="mt-3 max-w-2xl text-steam-muted">{subject.description}</p>
      </div>

      {posts.length === 0 ? (
        <p className="mt-12 text-steam-muted">
          No articles in this subject yet. Check back soon — or{" "}
          <a href="/submit" className="text-steam-mid underline">
            submit your notes
          </a>
          .
        </p>
      ) : (
        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
