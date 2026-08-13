import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAllPosts } from "@/lib/data";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const posts = await listAllPosts();
  const published = posts.filter((p) => p.status === "published").length;

  return (
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Editor</span>
            <h1 className="section__title">Admin dashboard</h1>
            <p className="section__lead">
              {published} published · {posts.length - published} draft. Review
              email submissions and publish them to the library.
            </p>
          </div>
          <Link href="/admin/posts/new" className="btn btn--primary">
            New article
            <Icon name="arrow-right" />
          </Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td style={{ fontWeight: 600 }}>{post.title}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {post.subjectName}
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
              ))}
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
