import { redirect } from "next/navigation";
import { PostForm } from "@/components/PostForm";
import { isAdminAuthenticated } from "@/lib/auth";
import { listSubjects } from "@/lib/data";

export const metadata = {
  title: "New article",
};

export default async function NewPostPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const subjects = await listSubjects();

  return (
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container container--narrow">
        <span className="section__eyebrow">Editor</span>
        <h1 className="section__title">New article</h1>
        <p className="section__lead">
          Paste content from an email submission, categorize it, and publish.
        </p>
        <PostForm subjects={subjects} />
      </div>
    </section>
  );
}
