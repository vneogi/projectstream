# Project STEAM — current status

Last updated: 18 October 2026

## Live now

- Production: [projectstream.vercel.app](https://projectstream.vercel.app)
- Latest deployed fix: `5675f46` — worldwide STEAM copy, safer PDF handling,
  better topic tags, and removal of public likes
- Database: Supabase, with RLS enabled on `posts` and `post_likes`
- Storage: private `materials` bucket; downloads go through authenticated server routes
- Login: Google only
- Analytics: GA4 `G-VJ57TFG135`
- Email ingest: latest Apps Script installed, with scanned-PDF OCR, binary-text
  detection, a 4MB upload limit, and no Gmail labels

## Completed functionality

- Gmail attachments become drafts; replies and messages without material are skipped
- PDF, PowerPoint, Word, image, spreadsheet, Google Docs, and Google Slides handling
- Scanned PDF/image OCR through Google Drive where possible
- Binary-looking PDF extraction is rejected instead of being pasted into Content
- Manual Editor file replacement/upload for edge cases
- AI title, subject, 6–12 searchable topics, card summary, and abstract
- File-type/processing tags such as `from-email`, `pdf`, and `needs-review`
  are excluded
- New Editor articles can select a file before the first save
- Published articles update Browse without a redeploy
- Draft deletion plus status/date filtering and sorting
- Psychology, Design, Other, and General STEM categories
- Public abstract pages and signed-in original-file downloads
- Ask AI grounded in published articles
- Public like button removed (like counts may still exist in the database)
- Clickable Latest Submissions
- Google-only student login
- GA page views plus search, Ask AI, download, and sign-in events

## Security completed in code/database

- RLS enabled; browser roles cannot query `posts` or `post_likes`
- Private Storage bucket with server-generated download links
- Service-role key used server-side only
- Signed, expiring Admin cookie tied to `ADMIN_PASSWORD`
- Default Admin password rejected on Vercel
- Safe same-site redirects after Google login
- Rate limits on Admin login, Ask AI, ingest, Auto-fill, and Admin uploads
- Security headers: frame blocking, MIME sniffing protection, restrictive device permissions
- Ingest endpoint protected by `INGEST_SECRET`

## Next: smoke test, then steamco.in

Do this on the current Vercel host before changing DNS:

- [ ] Sign into `/admin/login` with the current strong `ADMIN_PASSWORD`
- [ ] Open a draft, run Auto-fill, and confirm the subject and generated tags
  match the material
- [ ] Confirm generated tags do not include `from-email`, `pdf`, or
  `needs-review`
- [ ] Create a new draft, select a PDF before saving, save it, and confirm the
  file is attached
- [ ] Upload a normal text PDF and confirm readable text is used
- [ ] Upload a scanned/compressed PDF and confirm binary symbols are not added
  to Content; add a short overview and save successfully
- [ ] Confirm a file just under 4MB uploads and a file over 4MB gets a clear
  size error
- [ ] Sign in with Google as a student
- [ ] Download one article file
- [ ] Confirm article pages and cards no longer show likes
- [ ] Send one new attachment email and confirm a draft appears
- [ ] Confirm the email-created draft has a sensible subject, searchable tags,
  no binary Content, and the original file attached
- [ ] Check the homepage, footer, and About page for the updated worldwide
  STEAM wording
- [ ] Confirm GA4 Realtime sees the visit

Once these pass, move to `steamco.in` using the ordered checklist in
[AUTH.md](./AUTH.md#custom-domain-steamcoin).

## Optional, not blocking the domain

- Supabase custom Auth domain (`auth.steamco.in`) to replace the visible
  `….supabase.co` hostname on Google's first screen; this requires an eligible
  paid Supabase plan.
- Remove `OPENAI_API_KEY` from Vercel if it is still the invalid `gsk_…` value.
  Groq is the configured primary provider and works without OpenAI.
- Render Markdown in Ask AI answers if literal `**bold**` markers become
  distracting; answers work today, this is presentation-only.
- Add Terms and Privacy pages before broad public promotion.
