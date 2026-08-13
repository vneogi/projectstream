import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAllPosts } from "@/lib/data";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const posts = await listAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl text-steam-deep"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Admin dashboard
          </h1>
          <p className="mt-2 text-steam-muted">
            Review email submissions and publish to the library.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="bg-steam-warm px-5 py-2.5 font-medium text-white hover:bg-steam-deep"
        >
          New article
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-steam-deep/10 text-steam-muted">
            <tr>
              <th className="py-3 pr-4">Title</th>
              <th className="py-3 pr-4">Subject</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-steam-deep/5">
                <td className="py-3 pr-4 font-medium text-steam-ink">
                  {post.title}
                </td>
                <td className="py-3 pr-4 text-steam-muted">{post.subjectName}</td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      post.status === "published"
                        ? "text-green-700"
                        : "text-steam-warm"
                    }
                  >
                    {post.status}
                  </span>
                </td>
                <td className="py-3">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="text-steam-mid hover:text-steam-deep"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action="/api/admin/logout" method="POST" className="mt-10">
        <button
          type="submit"
          className="text-sm text-steam-muted underline hover:text-steam-deep"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
