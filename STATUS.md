# Project STEAM — current status

Last updated: 18 October 2026

## Live now

- Production: [projectstream.vercel.app](https://projectstream.vercel.app)
- Latest deployed fix: `54cf93d` — Auto-fill now stays within Groq's 8,000 TPM limit
- Database: Supabase, with RLS enabled on `posts` and `post_likes`
- Storage: private `materials` bucket; downloads go through authenticated server routes
- Login: Google only
- Analytics: GA4 `G-VJ57TFG135`
- Email ingest: latest Apps Script installed, with scanned-PDF OCR and no Gmail labels

## Completed functionality

- Gmail attachments become drafts; replies and messages without material are skipped
- PDF, PowerPoint, Word, image, spreadsheet, Google Docs, and Google Slides handling
- Scanned PDF/image OCR through Google Drive where possible
- Manual Editor file replacement/upload for edge cases
- AI title, subject, topics, card summary, and abstract
- Published articles update Browse without a redeploy
- Draft deletion plus status/date filtering and sorting
- Psychology, Design, Other, and General STEM categories
- Public abstract pages and signed-in original-file downloads
- Ask AI grounded in published articles
- Public like button removed (like counts may still exist in the database)
- Clickable Latest Submissions
- Google-only student login
- GA page views plus search, Ask AI, download, like, and sign-in events

## Security completed in code/database

- RLS enabled; browser roles cannot query `posts` or `post_likes`
- Private Storage bucket with server-generated download links
- Service-role key used server-side only
- Signed, expiring Admin cookie tied to `ADMIN_PASSWORD`
- Default Admin password rejected on Vercel
- Safe same-site redirects after Google login
- Rate limits on Admin login, Ask AI, ingest, likes, Auto-fill, and Admin uploads
- Security headers: frame blocking, MIME sniffing protection, restrictive device permissions
- Ingest endpoint protected by `INGEST_SECRET`

## Next: smoke test, then steamco.in

Do this on the current Vercel host before changing DNS:

- [ ] Sign into `/admin/login` with the current strong `ADMIN_PASSWORD`
- [ ] Open a draft, run Auto-fill, save it, and upload/replace one file
- [ ] Sign in with Google as a student
- [ ] Download one article file
- [ ] Like one article and confirm the count changes
- [ ] Send one new attachment email and confirm a draft appears
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
