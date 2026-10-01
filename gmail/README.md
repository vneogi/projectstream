# Gmail → Project STEAM draft ingest

Students email **projectsteamcollective@gmail.com** with notes as:

- **PDF** attachments  
- **PPTX / PPT** attachments  
- **Google Slides / Docs links** in the email body  

A Google Apps Script extracts the text, then POSTs it to your website as a **draft only**. You still review and publish in `/admin`.

```text
Gmail (+ PDF / PPTX / Slides link)
    ↓  Apps Script extracts text (Drive conversion)
POST /api/ingest/email
    ↓  Auto title + summary + subject (if GROQ/OpenAI set)
Supabase draft
    ↓
/admin → you Publish
```

## Prerequisites

1. **Supabase** connected + run `supabase/schema.sql`
2. Vercel env vars (then **Redeploy**):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `INGEST_SECRET`
   - `GROQ_API_KEY` (recommended — summaries from long slide decks)
3. Ask students to:
   - Attach PDF/PPTX/Word/image, **or**
   - Share Google Slides with `projectsteamcollective@gmail.com` (or “Anyone with the link”)

## Install / update Apps Script

1. Sign in as `projectsteamcollective@gmail.com`
2. [script.google.com](https://script.google.com) → your project (or New project)
3. Replace code with `ProjectSteamIngest.gs`
4. **Services (+)** → enable **Drive API**
5. Script properties:
   | Property | Value |
   |----------|--------|
   | `WEBHOOK_URL` | `https://YOUR-DOMAIN.vercel.app/api/ingest/email` |
   | `INGEST_SECRET` | same as Vercel |
6. Run `removeLegacyLabels` once (deletes old Ingested / Failed / Skipped labels). Approve Gmail, Drive, Docs, Slides, and external URL if asked.
7. Run `testWebhookOnly` → check `/admin` for a draft
8. Trigger: `processInbox` every 5–10 minutes

If you already installed an older script, **re-paste** this file and re-run once — attachment parsing is new.

## What becomes a draft

Only real submissions are ingested. Replies and emails without attachments are
marked read and left alone. The script does **not** create Gmail labels — use
your own.

| Email | Result |
|-------|--------|
| New email with PDF / PPTX / DOCX / image / spreadsheet attached | **Draft created** |
| New email with a Google Slides / Docs link | **Draft created** |
| `Re:` reply on an existing thread | Skipped |
| Any message threaded onto an earlier email | Skipped |
| Plain email with no attachment or link | Skipped |
| Mail sent by the Gmail account itself | Skipped |

`Fwd:` messages are allowed, because students often forward their own work.

Tuning flags at the top of `ProjectSteamIngest.gs`:

```js
var REQUIRE_MATERIAL = true;  // must have an attachment or Slides/Docs link
var SKIP_REPLIES = true;      // "Re:" and threaded messages never ingest
var SKIP_FORWARDS = false;    // set true to also ignore "Fwd:"
```

The website enforces the same rule, so an old copy of the script cannot create
drafts from plain replies.

## What gets extracted

| Student sends | How text is extracted |
|---------------|------------------------|
| `.pdf` | Convert to Google Doc; if almost no text, retry with Drive **OCR** (scanned / camera PDFs) |
| `.pptx` / `.ppt` / `.odp` | Convert to Google Slides → read slide + notes text |
| `.docx` / `.doc` / `.odt` / `.rtf` | Convert to Google Doc → read text |
| `.png` `.jpg` `.jpeg` `.gif` `.webp` `.img` | OCR via Drive when possible; original image is stored either way |
| `.xlsx` `.xls` `.csv` `.ods` | Convert to Google Sheets → read cell text |
| Google Slides link | Open presentation (if shared) → read slides |
| Google Doc link | Open doc (if shared) → read body |
| Plain email text | Included as-is |

Then the website LLM (Groq/OpenAI) builds the **title, subject,
topics, summary (2–3 lines), and abstract (10–20 lines)** for the draft.

## Limits & caveats

| Case | What happens |
|------|----------------|
| Scanned / image-only PDF | Drive OCR is attempted; if it still fails, attach a file in Editor or ask the student for a text PDF |
| Huge decks | Text is capped (~40k chars per file) so summaries stay focused |
| Private Slides link | Must share with the Gmail account or use “anyone with link” |
| Auto-publish | **Never** — always draft until you publish |

## Day-to-day

1. Student emails PDF/PPTX/Slides to `projectsteamcollective@gmail.com`
2. Within ~10 minutes a **draft** appears in `/admin` (Source: From email)
3. You review summary + subject → set **Published** → Save
4. Summary shows on cards; full text powers Search / Ask AI

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Enable Drive API` error | Services (+) → Drive API |
| Attachment ignored / empty notes | Re-paste the script so PDF OCR is on. Editor can also upload a file on the draft |
| Slides link not read | Share with `projectsteamcollective@gmail.com` |
| `401 Unauthorized` | Matching `INGEST_SECRET` in Vercel + Script properties |
| Replies still creating drafts | Re-paste the latest script — reply filtering is new |
| Weak summaries | Add `GROQ_API_KEY` and redeploy |
| Summaries empty / auto-fill warning about a model | Set `GROQ_MODEL` in Vercel to a current Groq model |
