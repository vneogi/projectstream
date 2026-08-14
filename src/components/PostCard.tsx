import Link from "next/link";
import { Icon } from "./Icon";
import { subjectIcon } from "@/lib/subject-icons";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className="card">
      <span className="card__eyebrow">
        <Icon name={subjectIcon(post.subjectSlug)} />
        {post.subjectName}
      </span>
      <h3 className="card__title">{post.title}</h3>
      <p className="card__desc">{post.excerpt}</p>
      {post.topics.length > 0 && (
        <div className="tag-row">
          {post.topics.slice(0, 3).map((topic) => (
            <span key={topic} className="tag">
              {topic}
            </span>
          ))}
        </div>
      )}
      <div className="card__meta">
        <span>{post.authorName}</span>
        <span>·</span>
        <span>{new Date(post.createdAt).toLocaleDateString("en-IN")}</span>
        {post.filePath ? (
          <>
            <span>·</span>
            <span>PDF · sign in to download</span>
          </>
        ) : null}
      </div>
    </Link>
  );
}
