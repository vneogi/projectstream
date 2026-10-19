# Security and privacy follow-up

Last reviewed: 19 October 2026

This file records items intentionally deferred after the `steamco.in` cutover.
Do not mark an item complete without testing it on the live domain.

## Verified from outside production

- `https://steamco.in` serves HTTPS and redirects plain HTTP to HTTPS.
- Public pages send HSTS, frame blocking, MIME-sniffing protection, referrer,
  and device-permission headers.
- Public search does not return the full article body.
- Admin Auto-fill, ingest, downloads, and like mutation reject anonymous
  requests.
- The old Vercel hostname remains available as a recovery route.
- Automated public smoke tests pass on both production hostnames.

## Priority 1 — before broad promotion

- [ ] Fix or remove `www.steamco.in`. It currently reaches Vercel but its TLS
  certificate does not cover the hostname. Either add `www.steamco.in` as a
  Vercel domain with Vercel's requested CNAME, or remove the GoDaddy `www`
  record and use only `steamco.in`.
- [ ] Add `/privacy` and `/terms` pages and link them in the footer. They should
  explain Google sign-in, Google Analytics, submitted email/files, AI
  processing, review before publication, retention/removal requests, and the
  project contact address.
- [ ] Confirm the Google OAuth consent screen is Published rather than Testing
  before inviting users who are not test accounts.
- [ ] Confirm 2-Step Verification is enabled on the Google, Vercel, Supabase,
  GitHub, and registrar accounts.
- [ ] Remove `OPENAI_API_KEY` from Vercel if it contains a Groq `gsk_…` key.
  Groq is the configured provider; an invalid fallback creates avoidable auth
  errors.
- [ ] Confirm Apps Script `WEBHOOK_URL` is
  `https://steamco.in/api/ingest/email` and run one real email-to-draft test.
- [ ] Change the GA4 stream website URL label to `https://steamco.in` while
  retaining measurement ID `G-VJ57TFG135`.

## Priority 2 — privacy/product decisions

- [ ] Decide whether Ask AI may use protected full-note text. Article pages
  require login for full notes, but the public Ask API currently sends excerpts
  of article content to the configured AI provider and may paraphrase them in
  public answers. If notes must be strictly login-only, ground Ask AI only from
  public abstracts/excerpts or require login for Ask AI.
- [ ] Document Groq (and OpenAI if enabled) as subprocessors in the Privacy
  page because submitted educational text is sent to the configured provider
  for Auto-fill and Ask AI.
- [ ] Decide a retention/removal process for source emails, Supabase drafts,
  stored files, and Google account data. Publish a simple contact-based
  deletion request process.
- [ ] Remove legacy public like data/API if likes will not return. The UI is
  gone, but `likeCount`, the like route, and the `post_likes` table remain.
- [ ] Add `robots.txt` and basic sitemap metadata. `robots.txt` currently
  returns 404; this is not a security control, but explicit crawler policy is
  useful before promotion.

## Priority 3 — defense in depth

- [ ] Add a tested Content Security Policy. Account for Next.js scripts,
  Supabase, Google Analytics, and Groq/server-only calls; do not deploy a strict
  policy without testing sign-in and analytics.
- [ ] Consider a paid Supabase custom Auth domain (`auth.steamco.in`) if the
  `supabase.co` hostname on Google's first sign-in screen is undesirable.
- [ ] Replace the in-memory endpoint rate limiter with a shared store if traffic
  grows. Serverless instances do not share the current in-process counters.
- [ ] Periodically rotate `ADMIN_PASSWORD` and `INGEST_SECRET`; immediately
  rotate the Supabase service-role key if it is ever exposed.

## Manual checks the agent cannot perform

- [ ] Sign into Google from an incognito browser and confirm return to
  `steamco.in`.
- [ ] Sign into Editor using the real Admin password.
- [ ] Download a protected file as a signed-in student.
- [ ] Verify the Supabase `materials` bucket remains private and has no direct
  anonymous/authenticated read policy.
- [ ] Verify only intended owners can access Vercel, Supabase, Google Cloud,
  GitHub, GoDaddy, and Apps Script dashboards.

