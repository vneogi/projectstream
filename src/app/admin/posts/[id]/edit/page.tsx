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
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container container--narrow">
        <span className="section__eyebrow">Editor</span>
        <h1 className="section__title">Edit article</h1>
        <PostForm subjects={subjects} post={post} />
      </div>
    </section>
  );
}
