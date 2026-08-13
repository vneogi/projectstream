import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Post, PostStatus } from "./types";
import {
  getPostBySlug,
  getPublishedPosts,
  getSubjectBySlug,
  searchPosts,
  subjects,
} from "./seed-data";

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
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
  if (error || !data) return null;
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
