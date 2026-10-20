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

const WEAK_ASK_TOKENS = new Set([
  "project",
  "projects",
  "steam",
  "website",
  "online",
  "page",
]);

/** Tokens that can ground an Ask AI answer in a library topic. */
export function askTopicTokens(query: string): string[] {
  return questionTokens(query).filter((token) => !WEAK_ASK_TOKENS.has(token));
}

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

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

function fuzzyMatch(token: string, candidates: string[]): boolean {
  const limit = token.length >= 8 ? 3 : token.length >= 5 ? 2 : 1;
  return candidates.some(
    (candidate) =>
      Math.abs(candidate.length - token.length) <= limit &&
      editDistance(token, candidate) <= limit,
  );
}

/**
 * Ask AI uses stricter public metadata than general Search. This avoids
 * grounding an answer in old malformed article bodies while still tolerating
 * student spelling mistakes such as "intttunet wrk".
 */
export function rankPostsForAsk(posts: Post[], query: string): Post[] {
  const tokens = askTopicTokens(query);
  if (tokens.length === 0) return [];

  const ranked = posts
    .map((post) => {
      const title = post.title.toLowerCase();
      const topics = post.topics.join(" ").toLowerCase();
      const summary = `${post.excerpt} ${post.abstract ?? ""}`.toLowerCase();
      const subject = `${post.subjectName} ${post.subjectSlug}`.toLowerCase();
      // Fuzzy matching is intentionally limited to editorial titles/tags.
      // Summaries contain enough prose that an unrelated word can otherwise
      // look deceptively close to a misspelling.
      const candidates = words(`${post.title} ${post.topics.join(" ")}`);
      let score = 0;

      for (const token of tokens) {
        if (title.includes(token)) score += 6;
        else if (topics.includes(token)) score += 5;
        else if (summary.includes(token)) score += 3;
        else if (subject.includes(token)) score += 2;
        else if (fuzzyMatch(token, candidates)) score += 2;
      }
      return { post, score };
    })
    .sort((a, b) => b.score - a.score);
  const bestScore = ranked[0]?.score ?? 0;
  if (bestScore < 2) return [];

  // A fuzzy token is enough to rescue a lone typo, but once a strong result
  // exists, discard weak fuzzy coincidences from unrelated articles.
  const cutoff = bestScore >= 3 ? Math.max(3, bestScore * 0.5) : 2;
  return ranked
    .filter(({ score }) => score >= cutoff)
    .map(({ post }) => post);
}

const QUERY_SUBJECTS: Array<{ slug: string; terms: string[] }> = [
  {
    slug: "biology",
    terms: ["photosynthesis", "plant", "cell", "dna", "biology", "genetic"],
  },
  {
    slug: "physics",
    terms: ["physics", "force", "motion", "electric", "light", "gravity"],
  },
  {
    slug: "chemistry",
    terms: ["chemistry", "chemical", "reaction", "atom", "molecule", "acid"],
  },
  {
    slug: "mathematics",
    terms: ["math", "algebra", "geometry", "equation", "calculus"],
  },
  {
    slug: "computer-science",
    terms: ["internet", "computer", "coding", "algorithm", "artificial intelligence"],
  },
  {
    slug: "psychology",
    terms: ["psychology", "brain", "mental", "emotion", "behaviour", "behavior"],
  },
  {
    slug: "design",
    terms: ["design", "poster", "visual", "typography"],
  },
];

/** Pick same-subject articles when the exact requested topic is unpublished. */
export function suggestPostsForQuery(posts: Post[], query: string): Post[] {
  const lower = query.toLowerCase();
  const subject = QUERY_SUBJECTS.find((entry) =>
    entry.terms.some((term) => lower.includes(term)),
  );
  if (!subject) return [];
  return posts.filter((post) => post.subjectSlug === subject.slug).slice(0, 4);
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
      // Likes only boost articles that already match the query, so a popular
      // unrelated post cannot bury a keyword hit. log2 keeps one viral article
      // from dominating forever (1 like ≈ +1, 7 ≈ +3, 31 ≈ +5).
      if (score > 0) score += Math.log2(1 + (post.likeCount ?? 0));
      return { post, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((row) => row.post);
}
