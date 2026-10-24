# Security and privacy follow-up

Last reviewed: 20 October 2026

Items intentionally still open after the steamco.in cutover, Ask AI grounding
work, and the Editor usage dashboard. Do not mark an item complete without
testing it on the live domain.

Implemented model: [SECURITY.md](./SECURITY.md) and [PRIVACY.md](./PRIVACY.md).

## Verified from outside production

- `https://steamco.in` serves HTTPS and redirects plain HTTP to HTTPS.
- Public pages send HSTS (via Vercel), frame blocking, MIME-sniffing
  protection, referrer, and device-permission headers.
- Public search does not return the full article body.
- Admin Auto-fill, ingest, downloads, and like mutation reject anonymous
  requests.
- `usage_events` exists; browser roles cannot read or write it.
- The old Vercel hostname remains available as a recovery route.
- Automated public smoke tests pass on both production hostnames.

## Done since the previous review

- Private Editor usage dashboard (`usage_events`) with hashed visitors and
  stored Search/Ask text for Editors only
- Ask AI no longer invents website how-tos; unpublished topics use a fixed
  sentence plus optional similar-topic cards
- Ask AI sends only public article metadata, summaries, and abstracts to the
  answer provider; stored article text is not rendered on public article pages
- Auto-fill grounded in extracted document text; OCR failure does not invent
  copy
- Email metadata excluded from article Content
- Public `/privacy` and `/terms` pages linked in the footer
- Dynamic `/robots.txt` and `/sitemap.xml`; Editor login removed from footer

## Priority 1 — before broad promotion

- [ ] Fix or remove `www.steamco.in`. It currently reaches Vercel but its TLS
  certificate does not cover the hostname. Either add `www.steamco.in` as a
  Vercel domain with Vercel’s requested CNAME, or remove the GoDaddy `www`
  record and use only `steamco.in`.
- [ ] Confirm the Google OAuth consent screen is Published rather than Testing
  before inviting users who are not test accounts.
- [ ] Confirm 2-Step Verification is enabled on the Google, Vercel, Supabase,
  GitHub, and registrar accounts.
- [ ] Remove `OPENAI_API_KEY` from Vercel if it contains a Groq `gsk_…` key.
- [ ] Confirm Apps Script `WEBHOOK_URL` is
  `https://steamco.in/api/ingest/email` and that a real email still becomes a
  draft.
- [ ] Change the GA4 stream website URL label to `https://steamco.in` while
  retaining measurement ID `G-VJ57TFG135`.

## Priority 2 — privacy/product decisions

- [ ] Choose fixed retention periods for source emails, unpublished drafts,
  stored files, and inactive Google account data. The public pages now provide
  an email-based correction/removal request process.
- [ ] Confirm the retention period for `usage_events` (180 days is suggested)
  and schedule or periodically run the cleanup SQL.
- [ ] Optionally set `ANALYTICS_HASH_SALT` so visitor hashes stay stable when
  other secrets rotate.
- [ ] Remove legacy public like data/API if likes will not return. The UI is
  gone, but `likeCount`, the like route, and the `post_likes` table remain.

## Priority 3 — defense in depth

- [ ] Add a tested Content Security Policy. Account for Next.js scripts,
  Supabase, Google Analytics, and Groq/server-only calls; do not deploy a
  strict policy without testing sign-in and analytics.
- [ ] Consider a paid Supabase custom Auth domain (`auth.steamco.in`) if the
  `supabase.co` hostname on Google’s first sign-in screen is undesirable.
- [ ] Replace the in-memory endpoint rate limiter with a shared store if
  traffic grows.
- [ ] Periodically rotate `ADMIN_PASSWORD` and `INGEST_SECRET`; immediately
  rotate the Supabase service-role key if it is ever exposed.

## Manual checks the agent cannot perform

- [ ] Sign into Google from an incognito browser and confirm return to
  `steamco.in`.
- [ ] Sign into Editor using the real Admin password and confirm the usage
  dashboard.
- [ ] Download a protected file as a signed-in student.
- [ ] Verify the Supabase `materials` bucket remains private and has no direct
  anonymous/authenticated read policy.
- [ ] Verify only intended owners can access Vercel, Supabase, Google Cloud,
  GitHub, GoDaddy, and Apps Script dashboards.
