import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost, listPublishedPosts } from "@/lib/data";

export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post?.title ?? "Article" };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.status !== "published") notFound();

  const paragraphs = post.content.split("\n\n").filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href={`/subjects/${post.subjectSlug}`}
        className="text-sm font-medium uppercase tracking-wide text-steam-warm"
      >
        {post.subjectName}
      </Link>
      <h1
        className="mt-3 text-4xl leading-tight text-steam-deep sm:text-5xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {post.title}
      </h1>
      <p className="mt-4 text-lg text-steam-muted">{post.excerpt}</p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm text-steam-muted">
        <span>By {post.authorName}</span>
        {post.authorSchool && <span>· {post.authorSchool}</span>}
        <span>· {new Date(post.createdAt).toLocaleDateString("en-IN")}</span>
      </div>
      {post.topics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.topics.map((topic) => (
            <Link
              key={topic}
              href={`/search?q=${encodeURIComponent(topic)}`}
              className="text-xs text-steam-muted hover:text-steam-deep"
            >
              #{topic}
            </Link>
          ))}
        </div>
      )}

      <div className="prose-steam mt-10 border-t border-steam-deep/10 pt-10">
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="mt-12 border-t border-steam-deep/10 pt-8">
        <p className="text-sm text-steam-muted">
          Found this helpful?{" "}
          <Link href="/submit" className="text-steam-mid underline">
            Share your own notes
          </Link>{" "}
          or{" "}
          <Link href="/ask" className="text-steam-mid underline">
            ask a question
          </Link>{" "}
          grounded in our library.
        </p>
      </div>
    </article>
  );
}
