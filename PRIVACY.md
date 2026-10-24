# Privacy handling

Last updated: 20 October 2026

This is the **internal** record of what Project STEAM collects and why. It is
not a substitute for the public pages now live at `/privacy` and `/terms`.
Remaining operational decisions are tracked in
[SECURITY_PRIVACY_BACKLOG.md](./SECURITY_PRIVACY_BACKLOG.md).

## Principles already in the product

- Submissions are **reviewed before they are published**.
- Students are asked **not** to put name, email, or phone in article text.
- Original files require Google sign-in; stored article text is not publicly
  rendered.
- Browser clients cannot query drafts, emails, likes, or usage events.
- Raw IP addresses are **not** stored in first-party analytics.
- GA4 is configured with `anonymize_ip`.
- Emails never auto-publish.

## Data the site holds

| Data | Where | Why | Who can see it |
|------|-------|-----|----------------|
| Published title, summary, abstract, topics | Supabase `posts` | Library cards and Search | Public site |
| Stored article text | `posts.content` | Editor review, Search, and internal processing | Editor / server |
| Original files | Private `materials` bucket | Download after login | Signed-in students via signed URL; Editor |
| Source Gmail message id / sender | `posts.source_*` | Deduping ingest | Editor / server only |
| Google user id (Auth) | Supabase Auth | Session, downloads | Server; not shown on articles |
| Search and Ask question text | `usage_events.query_text` (max 300 chars) | Editor demand dashboard | Editor only |
| Visitor hash | `usage_events.visitor_hash` | Approximate unique visitors | Editor only |
| Signed-in user id on some events | `usage_events.user_id` | Count of signed-in users / downloads | Editor only |
| GA4 page views and events | Google Analytics | Traffic reports | GA account owners |

Author name/school fields exist on posts but are not required. Prefer leaving
them empty so published work stays about the notes, not the student.

## First-party usage analytics

The Editor dashboard reads the last 30 days of `usage_events`.

Events: `page_view`, `search`, `ask`, `article_view`, `download`.

Visitor identity:

- The server HMAC-SHA256 hashes `IP + user-agent` with
  `ANALYTICS_HASH_SALT` (or `INGEST_SECRET` / `ADMIN_PASSWORD` if the salt is
  unset).
- Only a 32-character hex prefix is stored.
- The IP itself is not written to the database.

Suggested retention: delete events older than **180 days**:

```sql
delete from usage_events where created_at < now() - interval '180 days';
```

Run that periodically until a public retention policy is published.

## Google Analytics (GA4)

Measurement ID `G-VJ57TFG135`. Events include `page_view`, `search`,
`ask_ai`, `file_download`, and `sign_in_click`. Search terms can appear in the
GA `search` event. Names and emails are not sent to GA.

The like event name still exists in older docs; the public like button is gone.

## AI processors

Extracted educational text is sent to **Groq** (primary) and optionally
**OpenAI** for:

- Auto-fill of title, subject, topics, summary, and abstract
- Ask AI answers, using public article titles, subjects, topics, summaries, and
  abstracts only

Do not send personal identifiers in notes. Auto-fill is grounded only in
extracted attachment text, not the surrounding email.

These vendors are disclosed on the public Privacy page.

## Google sign-in

Students authenticate with Google through Supabase. Google shows its own
consent screen. Project STEAM uses the resulting session to unlock notes and
downloads. We do not display the student’s Google profile on articles.

Until a paid Supabase custom Auth domain is added, Google’s first screen still
shows the `….supabase.co` hostname. The consent app name is
**The Steam Collective Project**.

## Gmail submissions

Mail to `projectsteamcollective@gmail.com` is processed by Apps Script. The
message is marked read after ingest. The website stores extracted text, a
source message id, and the original file when it is under 4MB. Replies are not
ingested.

The public Privacy and Terms pages direct correction/removal requests to
`projectsteamcollective@gmail.com`. Fulfilment is manual: delete the
draft/article in `/admin`, remove the file from Storage if needed, and remove
the source email where appropriate.

## Open privacy decisions

These are implemented as-is and flagged in the backlog:

1. **Retention automation.** The public page states a 180-day aim for usage
   events, but cleanup remains a manual SQL operation until scheduling exists.
2. **Broader retention.** Drafts, source emails, files, and Google account data
   do not yet have fixed deletion periods; requests are handled by email.

## What is not collected

- Payment data (the site is free)
- Passwords for student accounts (Google handles that)
- Device camera / microphone / location (Permissions-Policy blocks them)
- Public like identities (the like UI is removed)
