import { createHmac } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type UsageEventType =
  | "page_view"
  | "search"
  | "ask"
  | "article_view"
  | "download";

type UsageInput = {
  eventType: UsageEventType;
  queryText?: string;
  postId?: string;
  userId?: string;
  resultCount?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

type RequestHeaders = Pick<Headers, "get">;

function visitorHash(headers: RequestHeaders): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip") || "";
  const agent = headers.get("user-agent") || "";
  if (!ip && !agent) return null;
  const secret =
    process.env.ANALYTICS_HASH_SALT ||
    process.env.INGEST_SECRET ||
    process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(`${ip}\n${agent}`)
    .digest("hex")
    .slice(0, 32);
}

/** Best-effort analytics: product functionality must not fail if logging does. */
export async function recordUsageEvent(
  request: Request,
  input: UsageInput,
): Promise<void> {
  return recordUsageEventFromHeaders(request.headers, input);
}

export async function recordUsageEventFromHeaders(
  headers: RequestHeaders,
  input: UsageInput,
): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const { error } = await admin.from("usage_events").insert({
    event_type: input.eventType,
    query_text: input.queryText?.trim().slice(0, 300) || null,
    post_id: input.postId ?? null,
    user_id: input.userId ?? null,
    visitor_hash: visitorHash(headers),
    result_count: input.resultCount ?? null,
    metadata: input.metadata ?? {},
  });
  if (error && error.code !== "42P01") {
    console.error("usage event insert failed", error.message);
  }
}

type UsageRow = {
  event_type: UsageEventType;
  query_text: string | null;
  post_id: string | null;
  user_id: string | null;
  visitor_hash: string | null;
  result_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type RankedMetric = { label: string; count: number; postId?: string };

export type UsageDashboardData = {
  configured: boolean;
  periodDays: number;
  totals: {
    searches: number;
    asks: number;
    pageViews: number;
    articleViews: number;
    downloads: number;
    activeVisitors: number;
    signedInUsers: number;
    unansweredAsks: number;
    zeroResultSearches: number;
  };
  topSearches: RankedMetric[];
  topQuestions: RankedMetric[];
  unansweredQuestions: RankedMetric[];
  zeroResultSearches: RankedMetric[];
  topViewed: RankedMetric[];
  topDownloaded: RankedMetric[];
  topPages: RankedMetric[];
  dailyActivity: RankedMetric[];
};

function rankText(
  rows: UsageRow[],
  type: UsageEventType,
  limit = 8,
): RankedMetric[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.event_type !== type || !row.query_text) continue;
    const label = row.query_text.trim().toLowerCase();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function rankPosts(
  rows: UsageRow[],
  type: UsageEventType,
  titles: Map<string, string>,
  limit = 8,
): RankedMetric[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.event_type !== type || !row.post_id) continue;
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([postId, count]) => ({
      postId,
      label: titles.get(postId) ?? "Deleted article",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getUsageDashboard(
  periodDays = 30,
): Promise<UsageDashboardData> {
  const empty: UsageDashboardData = {
    configured: false,
    periodDays,
    totals: {
      searches: 0,
      asks: 0,
      pageViews: 0,
      articleViews: 0,
      downloads: 0,
      activeVisitors: 0,
      signedInUsers: 0,
      unansweredAsks: 0,
      zeroResultSearches: 0,
    },
    topSearches: [],
    topQuestions: [],
    unansweredQuestions: [],
    zeroResultSearches: [],
    topViewed: [],
    topDownloaded: [],
    topPages: [],
    dailyActivity: [],
  };

  const admin = getSupabaseAdmin();
  if (!admin) return empty;
  const since = new Date(Date.now() - periodDays * 86_400_000).toISOString();
  const { data, error } = await admin
    .from("usage_events")
    .select(
      "event_type,query_text,post_id,user_id,visitor_hash,result_count,metadata,created_at",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10_000);
  if (error || !data) return empty;

  const rows = data as UsageRow[];
  const postIds = [...new Set(rows.flatMap((row) => (row.post_id ? [row.post_id] : [])))];
  const titles = new Map<string, string>();
  if (postIds.length > 0) {
    const { data: posts } = await admin
      .from("posts")
      .select("id,title")
      .in("id", postIds);
    for (const post of posts ?? []) titles.set(String(post.id), String(post.title));
  }

  const count = (type: UsageEventType) =>
    rows.filter((row) => row.event_type === type).length;
  const visitors = new Set(rows.flatMap((row) => (row.visitor_hash ? [row.visitor_hash] : [])));
  const users = new Set(rows.flatMap((row) => (row.user_id ? [row.user_id] : [])));
  const daily = new Map<string, number>();
  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    daily.set(day, (daily.get(day) ?? 0) + 1);
  }

  return {
    configured: true,
    periodDays,
    totals: {
      searches: count("search"),
      asks: count("ask"),
      pageViews: count("page_view"),
      articleViews: count("article_view"),
      downloads: count("download"),
      activeVisitors: visitors.size,
      signedInUsers: users.size,
      unansweredAsks: rows.filter(
        (row) => row.event_type === "ask" && row.result_count === 0,
      ).length,
      zeroResultSearches: rows.filter(
        (row) => row.event_type === "search" && row.result_count === 0,
      ).length,
    },
    topSearches: rankText(rows, "search"),
    topQuestions: rankText(rows, "ask"),
    unansweredQuestions: rankText(
      rows.filter((row) => row.result_count === 0),
      "ask",
    ),
    zeroResultSearches: rankText(
      rows.filter((row) => row.result_count === 0),
      "search",
    ),
    topViewed: rankPosts(rows, "article_view", titles),
    topDownloaded: rankPosts(rows, "download", titles),
    topPages: (() => {
      const counts = new Map<string, number>();
      for (const row of rows) {
        if (row.event_type !== "page_view") continue;
        const path = String(row.metadata?.path ?? "");
        if (!path) continue;
        counts.set(path, (counts.get(path) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([label, value]) => ({ label, count: value }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    })(),
    dailyActivity: [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([label, value]) => ({ label, count: value })),
  };
}

