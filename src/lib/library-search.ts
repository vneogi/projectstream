import type { Post } from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "can",
  "do",
  "does",
  "for",
  "from",
  "have",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "so",
  "than",
  "that",
  "the",
  "this",
  "to",
  "too",
  "use",
  "was",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
]);

export function questionTokens(query: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  const parts = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/);

  for (const part of parts) {
    if (part.length < 3 || STOP_WORDS.has(part) || seen.has(part)) continue;
    seen.add(part);
    tokens.push(part);
    if (tokens.length >= 8) break;
  }
  return tokens;
}

function haystack(post: Post): string {
  return [
    post.title,
    post.excerpt,
    post.abstract ?? "",
    post.content,
    post.subjectName,
    post.subjectSlug,
    ...post.topics,
  ]
    .join(" ")
    .toLowerCase();
}

/** Rank published posts for a student question or search box query. */
export function rankPostsForQuery(posts: Post[], query: string): Post[] {
  const phrase = query.trim().toLowerCase();
  if (!phrase) return posts;

  const tokens = questionTokens(query);
  const scored = posts
    .map((post) => {
      const text = haystack(post);
      let score = 0;
      if (text.includes(phrase)) score += 10;
      for (const token of tokens) {
        if (text.includes(token)) score += 1;
      }
      return { post, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((row) => row.post);
}
