# Security model

Last updated: 20 October 2026

This document describes **what is already deployed**. Remaining work lives in
[SECURITY_PRIVACY_BACKLOG.md](./SECURITY_PRIVACY_BACKLOG.md). Login and domain
recovery steps are in [AUTH.md](./AUTH.md).

## Threat model (student project)

Protect:

- Drafts and unpublished submissions
- Original student files
- Editor access
- The ingest webhook
- Service-role database credentials
- Student Google sessions

Accept for now (tracked in the backlog):

- No Content Security Policy yet
- In-memory rate limits (not shared across all serverless instances)
- `www.steamco.in` TLS coverage still needs a registrar/Vercel fix

## Public vs protected

| Surface | Protection |
|---------|------------|
| Home, Browse, Search, Ask AI, About, Submit | Public |
| Article abstract / summary | Public |
| Full notes | Google session required |
| Original file download | Google session + server-signed Storage URL (60s) |
| Editor | Signed cookie tied to `ADMIN_PASSWORD` |
| Gmail ingest | `INGEST_SECRET` on `/api/ingest/email` and `/api/ingest/upload` |
| Usage dashboard data | Service role only; RLS + revoke on `usage_events` |

The public Search API never returns full article bodies.

## Database and Storage

- `posts`, `post_likes`, and `usage_events` have **RLS enabled** and
  **no policies** for `anon` / `authenticated`. Browser keys cannot query them.
- The Next.js server uses `SUPABASE_SERVICE_ROLE_KEY` (never in client code).
- Storage bucket `materials` is **private**. There is no public object URL.
- Downloads go through `/api/download/[postId]`, which checks Google login,
  confirms the article is published, then creates a short-lived signed URL.

## Authentication

### Students

- Google is the only enabled public provider.
- After Google, Supabase sends the browser to `/auth/callback` on steamco.in.
- Redirect targets after login are restricted to same-site paths
  (`src/lib/safe-path.ts`). Protocol-relative and absolute URLs are rejected.

### Editor

- `/admin/login` sets a **signed, expiring cookie** derived from
  `ADMIN_PASSWORD` (`src/lib/admin-session.ts`).
- The old hardcoded `authenticated` cookie value is rejected.
- Changing `ADMIN_PASSWORD` invalidates existing Editor cookies.
- The placeholder `change-me-before-deploy` is **rejected on Vercel**.

## Secrets

| Secret | Where it lives | Used for |
|--------|----------------|----------|
| `ADMIN_PASSWORD` | Vercel | Editor cookie |
| `INGEST_SECRET` | Vercel + Apps Script | Email/file ingest |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server only) | Database and Storage |
| `GROQ_API_KEY` | Vercel | Ask AI and Auto-fill |
| `OPENAI_API_KEY` | Optional Vercel fallback | Must not be a Groq `gsk_…` key |
| `ANALYTICS_HASH_SALT` | Optional Vercel | Visitor hash; falls back to ingest/admin secret |

Never commit these. If a secret is pasted in chat or a screenshot, rotate it
(see AUTH.md “After a suspected leak”).

## Rate limits

In-process limits (`src/lib/rate-limit.ts`):

| Endpoint | Limit |
|----------|--------|
| Editor login | 8 / 15 min |
| Ask AI | 20 / 10 min |
| Auto-fill | 20 / 10 min |
| Admin file attach | 20 / 10 min |
| Email ingest | 60 / 10 min |
| Ingest upload | 60 / 10 min |
| Page-view logging | 240 / 10 min |
| Article-view logging | 120 / 10 min |

These counters are per serverless instance, so they slow casual abuse but are
not a global quota.

## HTTP headers

Every path sends:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Vercel also serves HTTPS and HSTS on steamco.in. A Content Security Policy is
not deployed yet.

## Ingest hardening

- Bearer / header secret required.
- Replies and emails without material are skipped (script + server).
- Binary-looking PDF extraction is discarded; the original file can still be
  attached.
- Uploads over 4MB are rejected with a clear error.
- Email metadata is excluded from public Content.
- Auto-fill uses extracted attachment text only and stops if OCR failed.

## AI grounding

- Auto-fill discards generated claims and tags that are not supported by the
  source extract.
- Ask AI only ranks **published** posts, prefers public metadata for matching,
  sends only public title/topic/summary/abstract fields to the answer provider,
  and refuses to invent website menus or how-to steps.
- Weak fuzzy matches are dropped so unrelated articles do not become sources.

## Verified from outside production

- `https://steamco.in` redirects HTTP to HTTPS.
- Public smoke tests pass on steamco.in and the recovery Vercel hostname.
- Anonymous Auto-fill, ingest, downloads, and like mutations are rejected.

## Account hygiene (operators)

Keep 2-Step Verification on Google, Vercel, Supabase, GitHub, and the domain
registrar. Do not invite student Google accounts as dashboard users. Students
only sign in on the public site.
