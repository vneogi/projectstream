# Website functionality

Last updated: 20 October 2026

This is the product map of [steamco.in](https://steamco.in). It describes what
each page and capability does for learners and for the Editor.

## Who can do what

| Capability | Anyone | Signed-in Google user | Editor (`/admin`) |
|------------|--------|------------------------|-------------------|
| Browse, Search, About, Submit | Yes | Yes | Yes |
| Read article abstract / summary | Yes | Yes | Yes |
| Ask AI | Yes | Yes | Yes |
| Read full notes | No | Yes | Yes (via public page) |
| Download original file | No | Yes | Yes |
| Create / edit / publish / delete articles | No | No | Yes |
| See usage dashboard | No | No | Yes |
| Trigger Gmail ingest | No | No | Apps Script only |

Google is the only student login. The Editor uses a separate password at
`/admin/login`, not a student Google account.

## Public pages

### Home (`/`)

Introduces Project STEAM, shows subjects with article counts, recent published
articles, Search, and calls to action for Ask AI and Share your work. The page
is generated from live published posts, so new articles appear without a
redeploy.

### Browse (`/browse`)

Lists every published article, grouped by subject. Subjects currently include
Physics, Chemistry, Biology, Mathematics, Computer Science, Engineering,
Psychology, Design, Other, and General STEM.

### Subject (`/subjects/[slug]`)

Shows all published articles in one subject, with cards linking to the article
page.

### Article (`/posts/[slug]`)

Always shows:

- Title, subject, summary, topics, and abstract
- A download control (locked until Google sign-in)
- Links to Search by topic and to Ask AI / Share your work

After Google sign-in, the same page also shows the full notes and unlocks the
original file download. The public like button was removed.

Article views are counted for the Editor dashboard.

### Search (`/search`)

Keyword search over published titles, excerpts, abstracts, topics, subjects,
and body text. Students can type a full question, not only an exact phrase.
Zero-result searches are logged as content gaps for the Editor.

### Ask AI (`/ask`)

Answers a student question using **published** library articles only.

- Ranks articles with typo-tolerant matching on titles and tags.
- Sends the top relevant articles to Groq to collate a grounded answer.
- Attributes facts inline (`In “Article Title,” we explore…`).
- Shows source cards under the answer.
- If the library has no matching article, it replies:
  **“Project STEAM has not yet published articles on this topic. Below are some
  similar topics for you to explore.”**
  and may list same-subject suggestions.
- Does not invent website how-tos, URLs, or facts that are not in the sources.

Ask AI is public. It currently grounds answers from article summaries plus a
capped excerpt of the stored notes. See [PRIVACY.md](./PRIVACY.md) for the
open decision about login-only notes vs public Ask answers.

### Share your work (`/submit`)

Explains how to contribute. Students email notes to
`projectsteamcollective@gmail.com` as a PDF, Word, PowerPoint, image,
spreadsheet, or Google Doc/Slides link. The page does not upload files in the
browser; Gmail ingest creates the draft. Submitters are asked not to include
name, email, or phone in the article text.

### About (`/about`)

Explains why the project exists: student-shared STEAM knowledge that should
not depend on school or location.

### Sign in (`/auth/login`)

Google-only student login. After success, the student returns to a safe
same-site path (usually the article they wanted to read or download).

## Editor pages

Editor routes are behind a signed, expiring cookie created at `/admin/login`.
The default placeholder password is rejected on Vercel.

### Dashboard (`/admin`)

Shows:

- Counts of published articles and drafts (including Gmail drafts)
- **Library usage** for the last 30 days: page views, active visitors,
  signed-in users, searches, Ask AI questions, article views, downloads,
  unanswered asks, and zero-result searches
- Ranked lists: questions asked, search terms, content gaps, most viewed
  articles, most downloaded articles, most visited pages, daily activity
- The article table with status/date sorting, filters, edit, and delete

The usage table (`usage_events`) is private. Browser roles cannot read it.

### New article (`/admin/posts/new`) and Edit (`/admin/posts/[id]/edit`)

Create or update a draft/published article. The Editor can:

- Set title, subject, topics, summary, abstract, and full notes
- Attach or replace the original file (including on the first save)
- Run **Auto-fill** (title, subject, 6–12 searchable topics, summary, abstract)
  from extracted document text only
- Publish, unpublish, or delete

Auto-fill will not invent copy when OCR failed. Binary-looking PDF dumps are
stripped from Content. Processing tags such as `from-email`, `pdf`, and
`needs-review` are not stored as topics.

## Behind-the-scenes capabilities

### Gmail ingest

Every 5–10 minutes, Apps Script processes unread mail on
`projectsteamcollective@gmail.com`. New messages with material become drafts.
Replies and empty emails are skipped. Details: [gmail/README.md](./gmail/README.md).

### File handling

Accepted: PDF, PowerPoint, Word, images, spreadsheets, Google Docs, Google
Slides. Originals up to 4MB are stored in the private `materials` bucket.
Downloads use a short-lived signed URL after Google login.

### Search API (`GET /api/search`)

Returns published card fields only (no full body). Used by the site and safe
to call publicly.

### Ask API (`POST /api/ask`)

Rate-limited. Returns answer, sources, provider, and whether the sources are
suggestions rather than matches.

### Usage events

The site records `page_view`, `search`, `ask`, `article_view`, and `download`
events for the Editor dashboard. Raw IP addresses are not stored. See
[PRIVACY.md](./PRIVACY.md).

## What students should expect

1. Find a topic via Home, Browse, Search, or Ask AI.
2. Read the abstract without an account.
3. Sign in with Google to read the full notes and download the original.
4. Email their own notes if they want to contribute. Publication is never
   automatic.
