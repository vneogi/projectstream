import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PostCard } from "@/components/PostCard";
import { getPostsBySubject, listSubjects } from "@/lib/data";
import { subjectIcon } from "@/lib/subject-icons";

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
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container">
        <span className="card__icon">
          <Icon name={subjectIcon(subject.slug)} />
        </span>
        <h1 className="section__title" style={{ marginTop: "16px" }}>
          {subject.name}
        </h1>
        <p className="section__lead">{subject.description}</p>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p>
              No articles here yet.{" "}
              <Link href="/submit">Share your notes</Link> and be the first.
            </p>
          </div>
        ) : (
          <div className="card-grid card-grid--3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
