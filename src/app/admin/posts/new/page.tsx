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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="text-3xl text-steam-deep"
        style={{ fontFamily: "var(--font-display)" }}
      >
        New article
      </h1>
      <p className="mt-2 text-steam-muted">
        Paste content from an email submission, categorize, and publish.
      </p>
      <div className="mt-8">
        <PostForm subjects={subjects} />
      </div>
    </div>
  );
}
