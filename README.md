# Project STEAM

A student passion-project website to publish STEM and educational content shared by hundreds of students — free for learners across India and the world.

**Live:** [https://projectstream.vercel.app](https://projectstream.vercel.app)

See **[OPS.md](./OPS.md)** for day-to-day operations: rename Vercel URL, enable Ask AI, Gmail ingest, editing text, and auto-summarize.

Built with **Next.js**, a hand-written CSS design system, and **Supabase** (optional for production database).

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
- **Ask Project STEAM** — grounded answers from your published library (+ optional Groq/OpenAI)
- Admin dashboard — login, create/edit/publish articles (for reviewing email submissions)

Demo content works out of the box. Connect Supabase to persist posts in production.

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

### 3. Custom domain

Buy a domain from **GoDaddy**, **Namecheap**, or **Cloudflare Registrar** (often cheapest).

In Vercel: Project → Settings → Domains → add your domain and follow DNS instructions.

Update `NEXT_PUBLIC_SITE_URL` to your domain.

### 4. Optional — smarter AI answers

Add `GROQ_API_KEY` (free) or `OPENAI_API_KEY` in Vercel. See [OPS.md](./OPS.md).

### 5. Update submit email

Edit `src/lib/site.ts` → `submitEmail` (already set to `projectsteamcollective@gmail.com`).

## Domain ideas for Project STEAM

Exact names may already be taken. Check availability on [GoDaddy](https://www.godaddy.com/domains) or [Cloudflare](https://www.cloudflare.com/products/registrar/).

| Domain style | Examples | Notes |
|--------------|----------|-------|
| Brand exact | `projectsteam.org`, `projectsteam.in` | Often taken — `projectsteam.org` may be for sale; `projectsteam.in` is used by another business |
| Brand with hyphen | `project-steam.org`, `project-steam.in` | Easier to find available |
| Purpose-led | `steamforkids.org`, `studentsteam.org`, `learnwithsteam.org` | Clear for education |
| India-focused | `steaminindia.org`, `projectsteamindia.org` | Good for local audience |
| Modern TLD | `projectsteam.app`, `projectsteam.site`, `projectsteam.education` | `.education` fits schools |

**Recommendation for a 10th-grade passion project:** pick something available + easy to say aloud, e.g. `projectsteamindia.org` or `steamforkids.org`, rather than paying for a parked domain.

## Workflow: email → website

1. Students email notes to your inbox
2. Daughter (or you) logs into `/admin`
3. **New article** — paste content, pick subject/topics, set author
4. **Publish** when reviewed
5. Content appears on browse/search/ask instantly

Later: automate with Gmail API or inbound email (Resend) creating **drafts** only — still review before publish.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run typecheck` | TypeScript check |

## License

Content is community-submitted for education. Add a simple terms page before public launch.
