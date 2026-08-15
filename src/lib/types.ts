export type PostStatus = "draft" | "published";

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  /** 2–3 line summary shown on cards and used by search / Ask AI. */
  excerpt: string;
  /** 10–20 line overview shown publicly on the article page. */
  abstract?: string;
  content: string;
  subjectId: string;
  subjectSlug: string;
  subjectName: string;
  topics: string[];
  authorName: string;
  authorSchool?: string;
  language: string;
  status: PostStatus;
  sourceMessageId?: string;
  sourceFrom?: string;
  /** Private storage path in Supabase Storage bucket `materials` */
  filePath?: string;
  fileName?: string;
  fileMime?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  posts: Post[];
  query: string;
  total: number;
}
