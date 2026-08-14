# Student social login + protected downloads

## What is public vs protected

| Feature | Login required? |
|---------|-----------------|
| Browse / subjects / search | No |
| Article **summary** (excerpt) | No |
| Ask AI | No |
| **Full notes** text | **Yes** |
| **PDF / PPTX download** | **Yes** |

This protects original student materials from anonymous downloading, while still letting anyone discover and learn from summaries / Ask AI.

**Honest limit:** Ask AI answers using library text on the server, so it can paraphrase content without login. It does **not** give the original PDF file.

---

## Setup (Supabase Auth + Storage)

### 1. Database columns
In Supabase → SQL Editor, re-run `supabase/schema.sql` (adds `file_path`, `file_name`, …).

### 2. Private storage bucket
1. Supabase → **Storage** → **New bucket**
2. Name: `materials`
3. **Public bucket: OFF** (private)
4. Create

### 3. Enable Google (and optional GitHub) login
1. Supabase → **Authentication** → **Providers**
2. Enable **Google**
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Application type: Web
   - Authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Paste Client ID + Secret into Supabase Google provider
5. (Optional) Enable **GitHub** the same way

### 4. Site URL / redirect allow list
Supabase → Authentication → **URL configuration**:

- Site URL: `https://your-domain.vercel.app`
- Redirect URLs add:
  - `https://your-domain.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (for local testing)

### 5. Vercel env vars
| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never expose in browser |
| `INGEST_SECRET` | Gmail webhook + file upload |
| `GROQ_API_KEY` | Summaries / Ask AI |

Redeploy after saving.

### 6. Refresh Gmail Apps Script
Re-paste `gmail/ProjectSteamIngest.gs` so it uploads original PDF/PPTX after creating a draft.

---

## Student experience

1. Anyone can browse cards, search, and use Ask AI  
2. Opening an article shows the **summary**  
3. **Sign in with Google** unlocks full notes + **Download**  
4. Download hits `/api/download/[postId]` → checks session → short-lived signed URL from private Storage  

---

## Admin notes

- Files are stored under `materials/{postId}/...`
- Email ingest uploads files ≤ ~3.5MB automatically (Vercel request limit)
- Larger files: compress, or upload later via a future Admin uploader
