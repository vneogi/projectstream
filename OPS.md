# Operations guide — Project STEAM

How to run [steamco.in](https://steamco.in).
Product map: [WEBSITE.md](./WEBSITE.md). Launch checklist: [STATUS.md](./STATUS.md).

---

## 1) Hostnames

| Thing | URL | Students see it? |
|-------|-----|------------------|
| Production | [steamco.in](https://steamco.in) | Yes |
| Recovery | [projectstream.vercel.app](https://projectstream.vercel.app) | Only if you share it |
| Vercel dashboard path | `vercel.com/…/projectsteam/…` | No |

Keep the Vercel hostname until steamco.in login, ingest, and TLS are trusted.
`www.steamco.in` still needs a certificate/DNS fix (backlog).

---

## 2) Ask AI

**Live.** Groq is the primary provider.

| Variable | Role |
|----------|------|
| `GROQ_API_KEY` | Required in production |
| `GROQ_MODEL` | Optional override (default `openai/gpt-oss-20b`) |
| `OPENAI_API_KEY` | Optional fallback; must be a real OpenAI key, not `gsk_…` |
| `OPENAI_MODEL` | Optional (`gpt-4o-mini` default) |

Without a provider key, Ask AI still returns a grounded excerpt summary.

Behaviour to expect:

- Consolidates matching published articles with inline titles
- Typo-tolerant title/tag matching
- Unpublished topic copy plus optional same-subject cards
- Rate limit: 20 questions / 10 minutes / instance

If answers look invented, check that the matching article’s Content is real
extracted text, not a leftover binary dump. Re-run Auto-fill only after the
source text is present.

---

## 3) Gmail → draft

**Live and draft-only.** Full steps: [gmail/README.md](./gmail/README.md).

```text
Gmail → Apps Script → POST https://steamco.in/api/ingest/email
      → Supabase draft → publish in /admin
```

Checklist:

1. `INGEST_SECRET` matches Vercel and Apps Script
2. `WEBHOOK_URL` = `https://steamco.in/api/ingest/email`
3. Latest `gmail/ProjectSteamIngest.gs` is pasted
4. Trigger on `processInbox` every 5–10 minutes

**Never auto-publishes.**

To reprocess a failed email: delete the bad draft if needed, mark the Gmail
message unread, wait for the trigger (or run `processInbox`). Auto-fill cannot
recover text that was never extracted.

---

## 4) Branding and copy

Site brand is **Project STEAM** (STEAM in all caps).

| What to change | Where |
|----------------|--------|
| Homepage headlines, hero, join CTA | `src/lib/site.ts` → `siteCopy` |
| Site name, description, submit email | `src/lib/site.ts` → `siteConfig` |
| About page | `src/app/about/page.tsx` |
| Local/demo articles | `src/lib/seed-data.ts` |
| Production articles | `/admin` |

Workflow for code copy: edit → commit → push `main` → Vercel redeploys.

---

## 5) Auto-fill

Admin → New/Edit article → **Auto-fill subject, topics, summary & abstract**.

- Reads a capped extract so long OCR documents fit Groq’s token limit
- Requests 6–12 searchable tags
- Excludes `from-email`, `pdf`, `needs-review`
- Does not replace readable full Content
- Stops instead of inventing copy when extraction failed

Requires `GROQ_API_KEY` (or OpenAI).

---

## 6) Email submission status

| Piece | Status |
|-------|--------|
| Submit page shows `projectsteamcollective@gmail.com` | Yes |
| “Write an email” opens the mail app | Yes (`mailto:`) |
| Gmail → website draft | Live on steamco.in |
| Auto-publish | **Never** |

---

## 7) Google Analytics

**On.** `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-VJ57TFG135`.
Setup and event names: [AUTH.md](./AUTH.md).
Keep this ID; do not create a second property for steamco.in.

---

## 8) Private Editor usage dashboard

SQL has been run. `/admin` reports the last 30 days:

- Page views and active visitors (hashed, not raw IP)
- Signed-in users
- Search terms and Ask AI questions
- Unanswered questions and zero-result searches
- Most viewed / downloaded articles
- Most visited pages and daily activity

Events start **after** the table exists. Historical GA visits are not imported.

Optional dedicated salt:

```env
ANALYTICS_HASH_SALT=
```

If unset, the hash uses `INGEST_SECRET` or `ADMIN_PASSWORD`. Changing those
secrets would rotate visitor identity, so a dedicated salt is better long-term.

Retention cleanup (suggested 180 days):

```sql
delete from usage_events where created_at < now() - interval '180 days';
```

---

## 9) Deploy habit

Push to `main` on [github.com/vneogi/projectstream](https://github.com/vneogi/projectstream).
Vercel production follows automatically.

If an env var starting with `NEXT_PUBLIC_` changes, you must **redeploy** so
it is baked into the browser bundle.

---

## 10) When something looks wrong

| Symptom | First check |
|---------|-------------|
| Ask AI cites unrelated articles | Confirm latest commit is deployed; try a clearer question |
| Ask AI invents how-tos | Should be blocked; report the question if it happens |
| Draft Content is random symbols | Clear Content, attach a cleaner PDF, or resend email |
| Auto-fill invents a topic | Extraction was empty — do not publish; resend/OCR |
| No usage numbers | Use the public site once, then refresh `/admin` |
| Google login returns to the wrong host | Supabase Site URL / Redirect URLs must include steamco.in |
| Ingest 401 | `INGEST_SECRET` mismatch |
