import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { isAdminAuthenticated } from "@/lib/auth";
import { hasDatabase, listAllPosts } from "@/lib/data";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const posts = await listAllPosts();
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft");
  const emailDrafts = drafts.filter((p) => Boolean(p.sourceMessageId));
  const dbReady = hasDatabase();

  return (
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Editor</span>
            <h1 className="section__title">Admin dashboard</h1>
            <p className="section__lead">
              {published} published · {drafts.length} draft
              {emailDrafts.length > 0
                ? ` · ${emailDrafts.length} from Gmail`
                : ""}
              . Review submissions and publish them to the library.
            </p>
          </div>
          <Link href="/admin/posts/new" className="btn btn--primary">
            New article
            <Icon name="arrow-right" />
          </Link>
        </div>

        {!dbReady && (
          <div className="panel panel--soft" style={{ marginBottom: "24px" }}>
            <p className="feature__title">Connect Supabase for Gmail drafts</p>
            <p className="card__desc">
              Email ingest needs a database so drafts survive redeploys. Follow{" "}
              <code>gmail/README.md</code> and run{" "}
              <code>supabase/schema.sql</code>, then add Supabase +{" "}
              <code>INGEST_SECRET</code> in Vercel.
            </p>
          </div>
        )}

        {dbReady && (
          <div className="panel panel--soft" style={{ marginBottom: "24px" }}>
            <p className="feature__title">Gmail → draft flow</p>
            <p className="card__desc">
              New mail to{" "}
              <strong>projectsteamcollective@gmail.com</strong> becomes a draft
              here (never auto-published). Setup guide:{" "}
              <code>gmail/README.md</code> in the repo.
            </p>
          </div>
        )}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                    No posts yet. Create one manually or wait for Gmail ingest.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td style={{ fontWeight: 600 }}>{post.title}</td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {post.subjectName}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                      {post.sourceMessageId ? (
                        <span title={post.sourceFrom}>From email</span>
                      ) : (
                        "Manual"
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          post.status === "published"
                            ? "status status--published"
                            : "status status--draft"
                        }
                      >
                        {post.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="link-arrow"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form action="/api/admin/logout" method="POST" style={{ marginTop: "32px" }}>
          <button type="submit" className="btn btn--secondary btn--sm">
            Log out
          </button>
        </form>
      </div>
    </section>
  );
}
