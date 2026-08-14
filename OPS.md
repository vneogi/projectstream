# Operations guide — Project STEAM

Quick answers for running [projectstream.vercel.app](https://projectstream.vercel.app).

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

The site prefers **Groq first**, then OpenAI. Without either key, Ask AI still returns a simple grounded summary from article excerpts (no generative model).

---

## 3) Pull documents from `projectsteamcollective@gmail.com`

**Wired as draft-only ingest.** Full steps: [`gmail/README.md`](./gmail/README.md)

```text
Gmail → Apps Script → POST /api/ingest/email → Supabase draft → you publish in /admin
```

Quick checklist:
1. Connect Supabase + run `supabase/schema.sql`
2. Set `INGEST_SECRET` (and Supabase keys) in Vercel → Redeploy
3. Paste `gmail/ProjectSteamIngest.gs` into Apps Script on that Gmail account
4. Add Script properties `WEBHOOK_URL` + `INGEST_SECRET`
5. Run `setupLabels`, then `testWebhookOnly`, then add a 5–10 min trigger on `processInbox`

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
| Demo articles (until Supabase) | `src/lib/seed-data.ts` |
| Real published articles | `/admin` on the live site (needs Supabase for persistence) |

Workflow: edit file → commit → push to GitHub → Vercel redeploys in ~1 minute.

**Important:** Without Supabase, posts created in `/admin` may not persist across redeploys. Connect Supabase (see README) for a real library.

---

## 6) Auto-categorize + summary

Built into Admin → **New article**:

1. Paste email body into **Content**
2. Click **Auto-fill title, summary & subject**
3. Review → set status to **Published** → save

The **summary (`excerpt`)** shows on cards and is fed into Ask AI grounding.

Requires `GROQ_API_KEY` or `OPENAI_API_KEY` (same as Ask AI).

---

## 7) Is email submission working?

| Piece | Status |
|-------|--------|
| Submit page shows `projectsteamcollective@gmail.com` | Yes |
| “Write an email” opens the user’s mail app | Yes (`mailto:`) |
| Gmail → website **draft** (Apps Script) | Ready — follow [`gmail/README.md`](./gmail/README.md) |
| Auto-publish from email | **Never** — review required |
