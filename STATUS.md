# Project STEAM — current status

Last updated: 20 October 2026

## Live now

- Production: [steamco.in](https://steamco.in)
- Recovery hostname: [projectstream.vercel.app](https://projectstream.vercel.app)
- Latest product commits:
  - `998c077` — Ask AI source ranking (typos kept, unrelated cards dropped)
  - `f480115` — grounded Ask AI copy + private Editor usage dashboard
- Database: Supabase, RLS on `posts`, `post_likes`, and `usage_events`
- Storage: private `materials` bucket; downloads go through authenticated
  server routes
- Login: Google only
- Analytics: GA4 `G-VJ57TFG135` plus first-party `usage_events`
- Email ingest: Apps Script on `projectsteamcollective@gmail.com` →
  `https://steamco.in/api/ingest/email`
- Usage dashboard SQL: **run** (`supabase/usage-analytics.sql`)

Product map: [WEBSITE.md](./WEBSITE.md).
Security model: [SECURITY.md](./SECURITY.md).
Privacy handling: [PRIVACY.md](./PRIVACY.md).

## Completed functionality

### Library

- Homepage, Browse, subject pages, article pages
- Search by question, keyword, subject, or topic
- Psychology, Design, Other, Engineering, and General STEM categories
- Public abstracts; original-file downloads after Google login
- Published articles appear without a redeploy
- Public like button removed (legacy `like_count` / `post_likes` may remain)

### Ask AI

- Grounded only in published articles
- Collates multiple sources with inline title attribution
- Tolerates common spelling mistakes (`intttunet` → Internet article)
- Unrelated weak matches are not attached as sources
- Unpublished topics return: *Project STEAM has not yet published articles on
  this topic. Below are some similar topics for you to explore.*
- Rate-limited; Groq first (`openai/gpt-oss-20b`), OpenAI optional fallback

### Editor

- Drafts from Gmail; never auto-published
- Create / edit / publish / unpublish / delete
- Status and date filtering/sorting
- File attach or replace, including before the first save
- Auto-fill title, subject, 6–12 searchable topics, summary, abstract
- Auto-fill uses extracted document text only and stops when OCR fails
- Binary-looking PDF dumps are not saved as Content
- File-type tags (`from-email`, `pdf`, `needs-review`) are excluded
- Private usage dashboard: questions, searches, views, downloads, gaps

### Ingest

- PDF, PowerPoint, Word, image, spreadsheet, Google Docs, Google Slides
- Drive OCR for scans, with wait/retry
- Google Doc IDs recovered from HTML when plain text dropped the URL
- Replies and empty emails skipped
- Original files up to 4MB stored privately
- Email metadata excluded from public Content

### Platform

- Google-only student login
- Signed Editor cookie; placeholder Admin password rejected on Vercel
- Security headers, rate limits, ingest secret
- GA page views plus search, Ask AI, download, and sign-in events
- Public Privacy and Terms pages linked in the footer
- `robots.txt` and a dynamic sitemap for public pages/articles
- Ask AI sends only public titles, topics, summaries, and abstracts to its
  answer provider

## Security and privacy completed

See [SECURITY.md](./SECURITY.md) and [PRIVACY.md](./PRIVACY.md). Short list:

- RLS + revoke on posts, likes, and usage events
- Private Storage; service-role key server-side only
- Safe same-site redirects after Google login
- No raw IP in usage analytics (keyed visitor hash)
- HTTPS on steamco.in

## Remaining human checks

Most of these cannot be finished from code review alone.

- [ ] Sign into `/admin/login` with the current `ADMIN_PASSWORD` and confirm
  the usage dashboard loads (empty zeros are fine until traffic arrives)
- [ ] Browse, Search, Ask AI, open an article, then refresh `/admin` and
  confirm events appear
- [ ] Ask “how does the intttunet wrk” → only *How the Internet Works*
- [ ] Ask a topic with no article → the unpublished-topic sentence
- [ ] Ask a topic covered by several biology notes → collated answer with
  inline titles
- [ ] Open a Gmail draft, run Auto-fill, confirm tags match the material and
  omit `from-email` / `pdf` / `needs-review`
- [ ] Send one new attachment email and confirm a clean draft + original file
- [ ] Sign in with Google as a student and download one file
- [ ] Confirm GA4 Realtime sees a visit

Follow-up items (www TLS, OAuth publish, account 2FA, and retention automation)
are tracked in [SECURITY_PRIVACY_BACKLOG.md](./SECURITY_PRIVACY_BACKLOG.md).

## Optional, not blocking the site

- Supabase custom Auth domain (`auth.steamco.in`) to hide `….supabase.co` on
  Google’s first screen (paid plan)
- Remove `OPENAI_API_KEY` from Vercel if it is still a Groq `gsk_…` value
- Render Markdown in Ask AI answers if `**bold**` markers are distracting
- Set `ANALYTICS_HASH_SALT` so visitor hashes do not rotate when admin/ingest
  secrets change
