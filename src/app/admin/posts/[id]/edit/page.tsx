import { notFound, redirect } from "next/navigation";
import { PostForm } from "@/components/PostForm";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAllPosts, listSubjects } from "@/lib/data";

export const metadata = {
  title: "Edit article",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const { id } = await params;
  const posts = await listAllPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();

  const subjects = await listSubjects();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="text-3xl text-steam-deep"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Edit article
      </h1>
      <div className="mt-8">
        <PostForm subjects={subjects} post={post} />
      </div>
    </div>
  );
}
