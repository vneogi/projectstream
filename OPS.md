# Operations guide — Project STEAM

Quick answers for running [projectstream.vercel.app](https://projectstream.vercel.app).
For the current launch checklist, see [STATUS.md](./STATUS.md).

---

## 1) Vercel project name vs public URL

**Not a mistake** if your dashboard is now:

`vercel.com/vneogis-projects/projectsteam/...`

That is only the **project name inside Vercel** (settings/dashboard path). Renaming it to `projectsteam` is what you wanted for branding.

| Thing | Example | What students see |
|-------|---------|-------------------|
| Vercel dashboard path | `…/projectsteam/settings` | No — only you |
| Public site URL | `projectstream.vercel.app` or `projectsteam.vercel.app` | Yes |

To get the nicer **public** URL:
1. Project → **Settings → Domains**
2. Add `projectsteam.vercel.app` (if available)
3. Make it the primary domain

Old `projectstream.vercel.app` can keep working until you remove it.

If `projectsteam.vercel.app` is taken, buy a custom domain (best long-term).

---

## 2) Make Ask AI live (OpenAI or free LLM)

Ask AI already works once you add a key. **Recommended for a student project: Groq (free).**

### Option A — Groq (free)

1. Create an account at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Vercel → Project → **Settings → Environment Variables**
4. Add:
   - Name: `GROQ_API_KEY`
   - Value: your key
   - Environment: Production (and Preview if you want)
5. **Redeploy** (Deployments → … → Redeploy)

### Option B — OpenAI (paid, cheap for light use)

Same steps with `OPENAI_API_KEY` from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

The site prefers **Groq first**, then OpenAI. The normal model is
`openai/gpt-oss-20b`; `openai/gpt-oss-120b` is a fallback. Llama 3.x IDs are no
longer used on developer keys.

Auto-fill sends a capped extract of long notes and requests only generated
metadata, keeping the request below Groq's 8,000 TPM developer limit. Full notes
remain unchanged in the Editor. If `OPENAI_API_KEY` contains a Groq `gsk_…` key,
remove it—OpenAI keys use their own provider format and are optional here.

Without either provider key, Ask AI still returns a grounded summary from
article excerpts and Auto-fill uses a simple text fallback.

---

## 3) Pull documents from `projectsteamcollective@gmail.com`

**Live and draft-only.** Supports PDF (including Drive OCR for scans and
binary-text rejection), PowerPoint, Word, images, spreadsheets, and Google
Slides/Docs links. Original files up to 4MB are attached. Full steps:
[`gmail/README.md`](./gmail/README.md)

```text
Gmail → Apps Script → POST /api/ingest/email → Supabase draft → you publish in /admin
```

Quick checklist:
1. Connect Supabase + run `supabase/schema.sql`
2. Set `INGEST_SECRET` (and Supabase keys) in Vercel → Redeploy
3. Paste `gmail/ProjectSteamIngest.gs` into Apps Script on that Gmail account
4. Add Script properties `WEBHOOK_URL` + `INGEST_SECRET`
5. Run `removeLegacyLabels` once (clears old Ingested / Failed / Skipped labels), then `testWebhookOnly`, then add a 5–10 min trigger on `processInbox`

**Never auto-publishes.** Emails become drafts only.

---

## 4) Branding: Project STEAM

Site brand is **Project STEAM** (STEAM in all caps).

---

## 5) How to update text on the site

| What to change | Where |
|----------------|--------|
| Homepage headlines, hero, join CTA | `src/lib/site.ts` → `siteCopy` |
| Site name, description, submit email | `src/lib/site.ts` → `siteConfig` |
| About page paragraphs | `src/app/about/page.tsx` |
| Local/demo fallback articles | `src/lib/seed-data.ts` |
| Production drafts and published articles | `/admin` on the live site |

Workflow: edit file → commit → push to GitHub → Vercel redeploys in ~1 minute.

---

## 6) Auto-categorize + summary

Built into Admin → **New/Edit article**:

1. Paste notes into **Content**, or open an ingested draft
2. Optionally upload/replace the original source file
3. Click **Auto-fill subject, topics, summary & abstract**
4. Review → set status to **Published** → save

Auto-fill reads a capped extract so long OCR documents fit Groq's token limit.
It requests 6–12 searchable tags and excludes processing labels such as
`from-email`, `pdf`, and `needs-review`. Wrapped JSON responses are recovered
when possible. It does not replace readable full Content; binary-looking PDF
output is discarded instead. The summary (`excerpt`) shows on cards and is fed
into Ask AI grounding.

Requires `GROQ_API_KEY` or `OPENAI_API_KEY` (same as Ask AI).

---

## 7) Is email submission working?

| Piece | Status |
|-------|--------|
| Submit page shows `projectsteamcollective@gmail.com` | Yes |
| “Write an email” opens the user’s mail app | Yes (`mailto:`) |
| Gmail → website **draft** (Apps Script) | Live; commit `5675f46` script includes scanned-PDF OCR, binary-text detection, and 4MB uploads |
| Auto-publish from email | **Never** — review required |

---

## 8) Google Analytics

**On.** Measurement ID `G-VJ57TFG135` is in Vercel (`NEXT_PUBLIC_GA_MEASUREMENT_ID`). The live site loads `gtag/js?id=G-VJ57TFG135`. Full setup: [AUTH.md](./AUTH.md). Keep this ID when moving to steamco.in.

---

## 9) Private Editor usage dashboard

Run [`supabase/usage-analytics.sql`](./supabase/usage-analytics.sql) once in the
Supabase SQL Editor. The Admin dashboard then reports:

- page views and active visitors
- signed-in active users
- Search and Ask AI questions
- unanswered questions and zero-result searches (content opportunities)
- most viewed and downloaded articles
- most visited pages and daily activity

Only the service-role server can access `usage_events`; browser roles are
revoked and RLS has no public policy. Raw IP addresses are never stored. The
server stores a keyed one-way visitor hash so unique activity can be estimated.
Search terms and Ask AI questions are retained because the Editor explicitly
needs to understand content demand. Use the documented 180-day cleanup query
unless a different retention period is chosen in the Privacy policy.

---

## 10) Next: smoke-test, then steamco.in

Security code (signed Admin cookie, safe redirects, rate limits, headers) and
database RLS are deployed. Auto-fill was retested after the token-limit fix.
Finish the remaining checks in [STATUS.md](./STATUS.md), then follow
**Custom domain: steamco.in** in [AUTH.md](./AUTH.md). Do not change DNS first:
Google login, Supabase redirects, and Gmail ingest must be updated together.

