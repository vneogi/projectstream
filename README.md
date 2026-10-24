# Project STEAM

A student passion-project website that publishes STEAM notes, quizzes, and
explanations shared by students — free for learners all over the world.

**Live:** [https://steamco.in](https://steamco.in)
**Recovery host:** [https://projectstream.vercel.app](https://projectstream.vercel.app)

Built with **Next.js**, Supabase, Vercel, Google Apps Script, Groq, and a
hand-written CSS design system.

## Documentation map

| Document | What it covers |
|----------|----------------|
| **[WEBSITE.md](./WEBSITE.md)** | What every public and Editor page does |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | How Gmail, Supabase, Ask AI, and the Editor connect |
| **[STATUS.md](./STATUS.md)** | What is live now and what still needs a human check |
| **[OPS.md](./OPS.md)** | Day-to-day operations: Ask AI, ingest, Auto-fill, usage dashboard |
| **[AUTH.md](./AUTH.md)** | Google login, domain, Analytics, and recovery setup |
| **[SECURITY.md](./SECURITY.md)** | Security model already in the code and database |
| **[PRIVACY.md](./PRIVACY.md)** | What data is collected, stored, and sent to vendors |
| **[SECURITY_PRIVACY_BACKLOG.md](./SECURITY_PRIVACY_BACKLOG.md)** | Remaining privacy and security work before broad promotion |
| **[gmail/README.md](./gmail/README.md)** | Gmail → draft ingest |

## What the site does

Students email notes to `projectsteamcollective@gmail.com`. A Gmail Apps Script
extracts the text, stores the original file, and creates an Editor **draft**.
A human reviews it in `/admin` and publishes. Published articles appear on the
homepage, Browse, Search, and Ask AI.

| For learners | For editors |
|--------------|-------------|
| Browse by subject | Drafts from Gmail, never auto-published |
| Search by question, topic, or keyword | Auto-fill title, subject, tags, summary, abstract |
| Ask AI answers grounded in published articles | Usage dashboard (questions, views, downloads) |
| Read abstracts without signing in | Upload or replace source files |
| Sign in with Google to download originals | Publish, unpublish, delete |

See [WEBSITE.md](./WEBSITE.md) for a page-by-page description.

## Stack

| Piece | Role |
|-------|------|
| Next.js 15 on Vercel | Website and API |
| Supabase | Posts, private file storage, Google Auth |
| Google Apps Script | Inbox polling and OCR |
| Groq (`openai/gpt-oss-20b`) | Ask AI and Auto-fill |
| GA4 `G-VJ57TFG135` | Public analytics |
| First-party `usage_events` | Private Editor dashboard |

## Quick start (local)

```bash
cd ~/Projects/project-steam
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
Admin: [http://localhost:3000/admin](http://localhost:3000/admin) using
`ADMIN_PASSWORD` from `.env.local`.

Without Supabase keys, the site uses local demo articles from
`src/lib/seed-data.ts`. Production content lives in Supabase.

### If `npm install` fails (certificate error)

Your network may use a corporate proxy. Use a personal network, or ask IT for
the correct npm certificate / registry settings.

## Production setup (already live)

The production project is already connected. Use this only to recreate it.

1. Create a Supabase project and run `supabase/schema.sql`.
2. Create a **private** Storage bucket named `materials`.
3. Import the GitHub repo into Vercel and set the variables in `.env.example`.
4. Point `steamco.in` at Vercel; keep the `*.vercel.app` host as recovery.
5. Paste `gmail/ProjectSteamIngest.gs` into Apps Script on
   `projectsteamcollective@gmail.com`.
6. Set Apps Script `WEBHOOK_URL` to `https://steamco.in/api/ingest/email`.

Full instructions: [AUTH.md](./AUTH.md) and [gmail/README.md](./gmail/README.md).

## Workflow: email → website

1. A student emails an attachment or Google Doc/Slides link to
   `projectsteamcollective@gmail.com`.
2. Apps Script extracts text (including Drive OCR for scans), rejects
   binary-looking PDF dumps, stores the original file if it is under 4MB, and
   POSTs to `/api/ingest/email`.
3. The website creates a **draft** and Auto-fills metadata from extracted text
   only. Email headers and sender details are not used as article copy.
4. The Editor reviews, replaces the file if needed, and publishes.
5. The article appears immediately in Browse, Search, and Ask AI.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run typecheck` | TypeScript check |
| `npm run test:unit` | Unit tests (security, enrich, search, LLM, ingest) |
| `npm run test:smoke` | Live checks against the deployed site |
| `npm test` | All local `tests/*.test.ts` files |

## Design system

All visual styling lives in `src/app/globals.css` as design tokens plus semantic
classes — no CSS framework.

| Token | Value | Used for |
|-------|-------|----------|
| `--bg` | `#f7f5fe` | Page background |
| `--primary` | `#6d54f5` | Links, icons, accents |
| `--gradient-primary` | violet → blue | Primary buttons |
| `--bg-dark` | `#0a0d26` | Dark call-to-action panels |
| `--radius-pill` / `--radius-xl` | `999px` / `28px` | Buttons / large panels |

Site copy (hero, About, submit email) is in `src/lib/site.ts`. Article content
is edited in `/admin`.

## License

Content is community-submitted for education. Public
[Privacy](https://steamco.in/privacy) and
[Terms](https://steamco.in/terms) pages are available on the site. Internal
handling is documented in [PRIVACY.md](./PRIVACY.md), and remaining work is in
[SECURITY_PRIVACY_BACKLOG.md](./SECURITY_PRIVACY_BACKLOG.md).
