# Architecture

Last updated: 20 October 2026

```text
Students ──email──► Gmail (projectsteamcollective@gmail.com)
                        │
                        │ Apps Script (OCR, extract, skip replies)
                        ▼
                 POST /api/ingest/email  (INGEST_SECRET)
                        │
                        ▼
              Supabase posts (status=draft)
              Storage materials (private file)
                        │
                        │ Editor reviews in /admin
                        ▼
              posts.status = published
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
     Browse/Search   Article page      Ask AI
     (public cards)  abstract public   published sources
                     notes/download    ──► Groq
                     after Google
```

## Runtime pieces

| Piece | Path / service | Notes |
|-------|----------------|-------|
| Next.js app | `src/app` | Pages + Route Handlers |
| Data access | `src/lib/data.ts` | Service role; seed fallback locally |
| Search ranking | `src/lib/library-search.ts` | Ask AI uses a stricter ranker |
| Auto-fill | `src/lib/enrich.ts` + `/api/admin/enrich` | Grounded JSON from extract |
| LLM | `src/lib/llm.ts` | Groq then OpenAI |
| Usage | `src/lib/usage.ts` | Best-effort inserts |
| Auth session | `src/middleware.ts` | Refreshes Supabase cookies |
| Editor session | `src/lib/admin-session.ts` | HMAC cookie |
| Ingest script | `gmail/ProjectSteamIngest.gs` | Must be re-pasted after changes |

## Environment

See `.env.example`. `NEXT_PUBLIC_*` values are baked in at **build** time.
Server secrets (`ADMIN_PASSWORD`, `INGEST_SECRET`, service role, Groq) are
read at runtime.

## Tests

`npm run test:unit` covers security helpers, ingest rules, enrich grounding,
search/Ask ranking, LLM fallbacks, and file-type checks. `npm run test:smoke`
hits the live host.
