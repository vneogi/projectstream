import Link from "next/link";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group">
      <Link href={`/posts/${post.slug}`} className="block">
        <p className="text-xs font-medium uppercase tracking-wide text-steam-warm">
          {post.subjectName}
        </p>
        <h3
          className="mt-1 text-xl text-steam-deep transition group-hover:text-steam-mid"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-steam-muted">
          {post.excerpt}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {post.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="text-xs text-steam-muted/80 before:content-['#']"
            >
              {topic}
            </span>
          ))}
        </div>
      </Link>
    </article>
  );
}
