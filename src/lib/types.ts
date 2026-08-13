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
  excerpt: string;
  content: string;
  subjectId: string;
  subjectSlug: string;
  subjectName: string;
  topics: string[];
  authorName: string;
  authorSchool?: string;
  language: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  posts: Post[];
  query: string;
  total: number;
}
