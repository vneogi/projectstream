# Gmail → Project STEAM draft ingest

Students email **projectsteamcollective@gmail.com**.  
A Google Apps Script reads new mail and POSTs it to your website as a **draft only**. You still review and publish in `/admin`.

```text
Gmail inbox
    ↓  Apps Script (every 5–10 min)
POST /api/ingest/email  (secret header)
    ↓
Supabase posts table  status = draft
    ↓
You review in /admin → Publish
```

## Prerequisites

1. **Supabase** connected (drafts must persist)
2. Run SQL in `supabase/schema.sql` (includes `source_message_id`)
3. Vercel env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `INGEST_SECRET` — long random string (e.g. `openssl rand -hex 32`)
   - Optional: `GROQ_API_KEY` for auto title/summary/subject
4. Redeploy after adding env vars

## Install Apps Script (15 minutes)

1. Sign in as `projectsteamcollective@gmail.com`
2. Open [script.google.com](https://script.google.com) → **New project**
3. Delete the default code and paste everything from `ProjectSteamIngest.gs`
4. **Project Settings** (gear) → **Script properties** → Add:
   | Property | Value |
   |----------|--------|
   | `WEBHOOK_URL` | `https://YOUR-DOMAIN.vercel.app/api/ingest/email` |
   | `INGEST_SECRET` | same as Vercel `INGEST_SECRET` |
5. Select function `setupLabels` → **Run** → approve Gmail + external request permissions
6. Select `testWebhookOnly` → **Run** → check Logs; then open `/admin` and confirm a new **draft**
7. Select `processInbox` → **Run** once on real unread mail
8. **Triggers** (clock icon) → Add trigger:
   - Function: `processInbox`
   - Event source: Time-driven
   - Every 5 or 10 minutes

## Safety rules (built in)

| Rule | Behavior |
|------|----------|
| Never auto-publish | API hard-codes `status: "draft"` |
| No duplicates | Same Gmail `messageId` is skipped |
| Labeled after success | `ProjectSTEAM/Ingested` |
| Failures labeled | `ProjectSTEAM/Failed` (re-run after fixing) |

## Day-to-day workflow

1. Students email notes to `projectsteamcollective@gmail.com`
2. Within ~10 minutes a **draft** appears in `/admin`
3. Open **Edit** → review Auto-fill fields → set **Published** → Save
4. Article appears on Browse / Search / Ask AI

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` | `INGEST_SECRET` mismatch between Script properties and Vercel |
| `503 Supabase is not configured` | Add Supabase keys + redeploy |
| Drafts never appear | Check Apps Script Executions log; confirm trigger is enabled |
| Mail stuck with Failed label | Fix error, remove Failed label, mark unread, re-run `processInbox` |
| Attachments missing | v1 imports **email body text only** — paste PDF text in Admin if needed |

## Optional: only process a label

If the inbox is busy, change the search query in `processInbox` to:

```javascript
var query = "label:ProjectSTEAM/ToIngest -label:ProjectSTEAM/Ingested";
```

Then create label `ProjectSTEAM/ToIngest` and move submissions there.
