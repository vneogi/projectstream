import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { MaterialAccess } from "@/components/MaterialAccess";
import { getPost, listPublishedPosts } from "@/lib/data";
import { getSessionUser } from "@/lib/supabase/server";

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

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.status !== "published") notFound();

  const user = await getSessionUser();
  const isLoggedIn = Boolean(user);
  const paragraphs = post.content.split("\n\n").filter(Boolean);

  return (
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container container--narrow">
        <article>
          <header className="article__header">
            <Link href={`/subjects/${post.subjectSlug}`} className="card__eyebrow">
              {post.subjectName}
            </Link>
            <h1 className="article__title">{post.title}</h1>
            <p className="article__lead">{post.excerpt}</p>
            <div className="meta-row">
              <span>By {post.authorName}</span>
              {post.authorSchool && <span>{post.authorSchool}</span>}
              <span>{new Date(post.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
            {post.topics.length > 0 && (
              <div className="tag-row" style={{ marginTop: "16px" }}>
                {post.topics.map((topic) => (
                  <Link
                    key={topic}
                    href={`/search?q=${encodeURIComponent(topic)}`}
                    className="tag"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            )}
          </header>

          <MaterialAccess
            postId={post.id}
            slug={post.slug}
            hasFile={Boolean(post.filePath)}
            fileName={post.fileName}
            isLoggedIn={isLoggedIn}
          />

          {isLoggedIn ? (
            <div className="prose" style={{ marginTop: "32px" }}>
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : (
            <div className="prose" style={{ marginTop: "32px" }}>
              <p>
                <strong>Public summary:</strong> {post.excerpt}
              </p>
              <p style={{ color: "var(--text-muted)" }}>
                Sign in to read the full notes and download the original
                PDF/PPTX. Search and Ask AI remain available without an account.
              </p>
            </div>
          )}
        </article>

        <div className="panel panel--soft" style={{ marginTop: "48px" }}>
          <h2 className="feature__title">Found this helpful?</h2>
          <p className="card__desc" style={{ marginBottom: "20px" }}>
            Share your own notes so another student can learn the same way, or
            ask a question answered from our library.
          </p>
          <div className="hero__ctas" style={{ marginBottom: 0 }}>
            <Link href="/submit" className="btn btn--primary">
              Share your work
              <Icon name="arrow-right" />
            </Link>
            <Link href="/ask" className="btn btn--secondary">
              Ask a question
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
