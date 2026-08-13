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
    <>
      <section className="section section--tight">
        <div className="page-glow" />
        <div className="container">
          <span className="section__eyebrow">The library</span>
          <h1 className="section__title">Browse everything</h1>
          <p className="section__lead">
            {posts.length} published article{posts.length === 1 ? "" : "s"}{" "}
            across {subjects.length} subjects. Start with a subject, or scroll
            through the full list below.
          </p>
          <div className="card-grid card-grid--3">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                count={counts[subject.slug] ?? 0}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="section__head">
            <div>
              <span className="section__eyebrow">All articles</span>
              <h2 className="section__title">Every published piece</h2>
            </div>
          </div>
          {posts.length === 0 ? (
            <div className="empty-state">
              <p>No articles published yet.</p>
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
    </>
  );
}
