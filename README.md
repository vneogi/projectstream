# Project STEAM

A student passion-project website to publish STEAM and educational content shared by hundreds of students — free for learners all over the world.

**Live:** [https://steamco.in](https://steamco.in)
**Recovery host:** [https://projectstream.vercel.app](https://projectstream.vercel.app)

See **[STATUS.md](./STATUS.md)** for what is done and what is next,
**[OPS.md](./OPS.md)** for day-to-day operations,
**[AUTH.md](./AUTH.md)** for security/login/domain setup, and
**[gmail/README.md](./gmail/README.md)** for Gmail → draft ingest.
Deferred security and privacy work is tracked in
**[SECURITY_PRIVACY_BACKLOG.md](./SECURITY_PRIVACY_BACKLOG.md)**.

Built with **Next.js**, Supabase, Vercel, Google Apps Script, Groq, and a
hand-written CSS design system.

## Design system

All visual styling lives in `src/app/globals.css` as design tokens plus semantic classes — no CSS framework to learn.

| Token | Value | Used for |
|-------|-------|----------|
| `--bg` | `#f7f5fe` | Page background (soft lavender) |
| `--primary` | `#6d54f5` | Links, icons, accents |
| `--gradient-primary` | violet → blue | Primary buttons, badges |
| `--bg-dark` | `#0a0d26` | Dark call-to-action panels |
| `--radius-pill` / `--radius-xl` | `999px` / `28px` | Buttons / large panels |

Change a token once and it updates everywhere.

## What's included

- Public home, browse by subject, article pages, search
- Submit page (email workflow)
- **Ask Project STEAM** — grounded answers from published library articles
- Admin dashboard — create/edit/publish/delete drafts and upload source files
- Gmail attachment ingest with OCR and draft-only publishing
- Google login with protected notes/downloads
- Google Analytics events for search, Ask AI, downloads, and sign-in

Demo content works locally; production content persists in Supabase.

## Quick start (local)

```bash
cd ~/Projects/project-steam
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Admin:** [http://localhost:3000/admin](http://localhost:3000/admin) — default password is in `.env.local` (`ADMIN_PASSWORD`).

### If `npm install` fails (certificate error)

Your network may use a corporate proxy. Options:

1. Ask IT for the correct npm certificate / registry settings
2. Use a personal network for install
3. Run from a machine without SSL inspection

## Production setup

### 1. Database — Supabase (free tier)

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run `supabase/schema.sql`
3. Settings → API → copy URL, anon key, and **service role** key
4. Add to Vercel environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=your-strong-password
```

### 2. Hosting — Vercel (free tier)

1. Push this repo to GitHub
2. [vercel.com](https://vercel.com) → Import project
3. Add the env vars above
4. Deploy — your site gets a `*.vercel.app` URL immediately

### 3. Custom domain (steamco.in)

The domain is purchased. Run the smoke test in [STATUS.md](./STATUS.md), then
follow **Custom domain: steamco.in** in [AUTH.md](./AUTH.md): Vercel + GoDaddy
DNS, `NEXT_PUBLIC_SITE_URL`, Supabase redirects, Apps Script `WEBHOOK_URL`, and
the existing GA property.

### 4. AI provider

Production uses `GROQ_API_KEY` with `openai/gpt-oss-20b`. OpenAI is an optional
fallback only. Long Auto-fill requests are capped to fit Groq's developer-tier
token limit. See [OPS.md](./OPS.md).

### 5. Update submit email

Edit `src/lib/site.ts` → `submitEmail` (already set to `projectsteamcollective@gmail.com`).

## Workflow: email → website

1. Students email an attachment to `projectsteamcollective@gmail.com`.
2. Apps Script extracts text/OCR, waits for delayed Drive conversion, rejects
   binary-looking PDF output, stores the original (up to 4MB), and creates a
   draft.
3. The Editor reviews or replaces the file and runs Auto-fill when needed.
4. The Editor publishes after checking the generated fields.
5. The article appears immediately in Browse, Search, and Ask AI.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run typecheck` | TypeScript check |
| `npm run test:unit` | Unit tests (security, enrich, search, LLM helpers) |
| `npm run test:smoke` | Live checks against the deployed Vercel site |
| `npm test` | All local `tests/*.test.ts` files |

## License

Content is community-submitted for education. Terms and Privacy pages remain a
pre-promotion task; see
[SECURITY_PRIVACY_BACKLOG.md](./SECURITY_PRIVACY_BACKLOG.md).
