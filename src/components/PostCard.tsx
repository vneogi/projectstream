import Link from "next/link";
import { Icon } from "./Icon";
import { subjectIcon } from "@/lib/subject-icons";
import { downloadLabel } from "@/lib/file-types";
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
        <span>{new Date(post.createdAt).toLocaleDateString("en-IN")}</span>
        {post.filePath ? (
          <>
            <span>·</span>
            <span>{downloadLabel(post.fileName)} · sign in to download</span>
          </>
        ) : null}
        {post.likeCount > 0 ? (
          <>
            <span>·</span>
            <span>{post.likeCount} likes</span>
          </>
        ) : null}
      </div>
    </Link>
  );
}
