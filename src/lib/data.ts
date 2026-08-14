import type { Post, PostStatus } from "./types";
import {
  getPostBySlug,
  getPublishedPosts,
  getSubjectBySlug,
  searchPosts,
  subjects,
} from "./seed-data";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function mapRow(row: Record<string, unknown>): Post {
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

export function hasDatabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function listSubjects() {
  return subjects;
}

export async function listPublishedPosts(): Promise<Post[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getPublishedPosts();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data) return getPublishedPosts();
  return data.map(mapRow);
}

export async function listAllPosts(): Promise<Post[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getPublishedPosts();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return getPublishedPosts();
  return data.map(mapRow);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getPostBySlug(slug);

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return getPostBySlug(slug);
  return mapRow(data);
}

export async function getPostsBySubject(subjectSlug: string): Promise<Post[]> {
  const subject = getSubjectBySlug(subjectSlug);
  if (!subject) return [];

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return getPublishedPosts().filter((p) => p.subjectSlug === subjectSlug);
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("subject_slug", subjectSlug)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return getPublishedPosts().filter((p) => p.subjectSlug === subjectSlug);
  }
  return data.map(mapRow);
}

export async function searchPublishedPosts(query: string): Promise<Post[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return searchPosts(query);

  const q = query.trim();
  if (!q) return await listPublishedPosts();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .or(
      `title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%,subject_name.ilike.%${q}%`,
    )
    .order("created_at", { ascending: false });

  if (error || !data) return searchPosts(query);
  return data.map(mapRow);
}

export interface CreatePostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  subjectSlug: string;
  topics: string[];
  authorName: string;
  authorSchool?: string;
  language: string;
  status: PostStatus;
  sourceMessageId?: string;
  sourceFrom?: string;
  filePath?: string;
  fileName?: string;
  fileMime?: string;
  fileSize?: number;
}

export async function getPostById(id: string): Promise<Post | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data);
}

export async function findPostBySourceMessageId(
  sourceMessageId: string,
): Promise<Post | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("source_message_id", sourceMessageId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data);
}

export async function createPost(input: CreatePostInput): Promise<Post | null> {
  const subject = getSubjectBySlug(input.subjectSlug);
  if (!subject) return null;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const row = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    subject_id: subject.id,
    subject_slug: subject.slug,
    subject_name: subject.name,
    topics: input.topics,
    author_name: input.authorName,
    author_school: input.authorSchool ?? null,
    language: input.language,
    status: input.status,
    source_message_id: input.sourceMessageId ?? null,
    source_from: input.sourceFrom ?? null,
    file_path: input.filePath ?? null,
    file_name: input.fileName ?? null,
    file_mime: input.fileMime ?? null,
    file_size: input.fileSize ?? null,
    created_at: now,
    updated_at: now,
  };

  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      ...input,
      subjectId: subject.id,
      subjectName: subject.name,
      createdAt: now,
      updatedAt: now,
    };
  }

  const { data, error } = await supabase.from("posts").insert(row).select().single();
  if (error || !data) {
    console.error("createPost failed", error?.message);
    return null;
  }
  return mapRow(data);
}

export async function updatePost(
  id: string,
  input: Partial<CreatePostInput>,
): Promise<Post | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title) updates.title = input.title;
  if (input.slug) updates.slug = input.slug;
  if (input.excerpt) updates.excerpt = input.excerpt;
  if (input.content) updates.content = input.content;
  if (input.topics) updates.topics = input.topics;
  if (input.authorName) updates.author_name = input.authorName;
  if (input.authorSchool !== undefined) updates.author_school = input.authorSchool;
  if (input.language) updates.language = input.language;
  if (input.status) updates.status = input.status;
  if (input.filePath !== undefined) updates.file_path = input.filePath;
  if (input.fileName !== undefined) updates.file_name = input.fileName;
  if (input.fileMime !== undefined) updates.file_mime = input.fileMime;
  if (input.fileSize !== undefined) updates.file_size = input.fileSize;

  if (input.subjectSlug) {
    const subject = getSubjectBySlug(input.subjectSlug);
    if (subject) {
      updates.subject_id = subject.id;
      updates.subject_slug = subject.slug;
      updates.subject_name = subject.name;
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return mapRow(data);
}

export async function deletePost(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("posts").delete().eq("id", id);
  return !error;
}
