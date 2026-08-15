import type { Post, PostStatus } from "./types";

/** Maps a Supabase posts row into the app Post shape. */
export function mapPostRow(row: Record<string, unknown>): Post {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt ?? ""),
    content: String(row.content),
    subjectId: String(row.subject_id),
    subjectSlug: String(row.subject_slug),
    subjectName: String(row.subject_name),
    topics: (row.topics as string[]) ?? [],
    authorName: String(row.author_name ?? "Contributor"),
    authorSchool: row.author_school ? String(row.author_school) : undefined,
    language: String(row.language ?? "en"),
    status: row.status as PostStatus,
    sourceMessageId: row.source_message_id
      ? String(row.source_message_id)
      : undefined,
    sourceFrom: row.source_from ? String(row.source_from) : undefined,
    filePath: row.file_path ? String(row.file_path) : undefined,
    fileName: row.file_name ? String(row.file_name) : undefined,
    fileMime: row.file_mime ? String(row.file_mime) : undefined,
    fileSize:
      typeof row.file_size === "number"
        ? row.file_size
        : row.file_size
          ? Number(row.file_size)
          : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
