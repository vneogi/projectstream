# Operations guide — Project Steam

Quick answers for running [projectstream.vercel.app](https://projectstream.vercel.app).

---

## 1) Rename Vercel URL to `projectsteam.vercel.app`

Yes — but only if that name is still free.

1. Open [vercel.com/dashboard](https://vercel.com/dashboard) → your project
2. **Settings → Domains**
3. Click **Add** → try `projectsteam.vercel.app`
4. If available, set it as the primary domain
5. Keep or remove `projectstream.vercel.app`

If `projectsteam` is taken, options:
- Use a custom domain (best long-term): e.g. `projectsteam.in` / `.org`
- Or rename the **GitHub repo** and create a **new** Vercel project named `projectsteam` (old URL can keep working until you delete it)

Note: GitHub repo is currently `projectstream` — that does **not** have to match the Vercel subdomain, but matching names reduces confusion.

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

**Not automatic yet.** Today the flow is:

`student emails Gmail → human reads → paste into /admin → publish`

### Recommended next steps (student-friendly)

**Phase A (now):** Keep using Gmail + Admin paste + **Auto-fill** button (title, summary, subject, topics).

**Phase B (next build):** Google Apps Script on that Gmail account that POSTs new messages to a Project Steam webhook as **drafts** only (never auto-publish).

**Phase C:** Full Gmail API OAuth for continuous sync.

We will not auto-publish from email — review stays required for student safety.

When you're ready for Phase B, ask to “wire Gmail Apps Script ingest”.

---

## 4) Branding: Project Steam (not Project_Steam)

Done in code. After redeploy, the site shows **Project Steam**.

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

**Partially.**

| Piece | Status |
|-------|--------|
| Submit page shows `projectsteamcollective@gmail.com` | Yes (after this deploy) |
| “Write an email” opens the user’s mail app | Yes (`mailto:`) |
| Site automatically reads the Gmail inbox | **No — not yet** |
| Admin publish after manual paste | Yes |

So students *can* email you; the site does *not* yet import those emails by itself.
