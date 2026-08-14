# Student social login + protected downloads

## What is public vs protected

| Feature | Login required? |
|---------|-----------------|
| Browse / subjects / search | No |
| Article **summary** (excerpt) | No |
| Ask AI | No |
| **Full notes** text | **Yes** |
| **PDF / PPTX download** | **Yes** |

---

## Already done (you said #1 and #2 are done)

- [x] Run `supabase/schema.sql`
- [x] Create private Storage bucket named `materials`

Continue from **Step A** below.

---

## Step A — Find your Supabase project URL (need this twice)

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your Project STEAM project
3. Click **Project Settings** (gear, bottom-left)
4. Click **API**
5. Copy and keep these three values somewhere safe (Notes app):

| Label in Supabase | Looks like | Use as env var |
|-------------------|------------|----------------|
| **Project URL** | `https://abcdefgh.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** key | long `eyJ...` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** key (secret) | long `eyJ...` | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ Never put `service_role` in frontend code or GitHub. Only in Vercel env vars.

Also note your **Project Reference ID** (same page / URL). Your auth callback for Google will be:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Example: if Project URL is `https://xyzcompany.supabase.co`, then:

```text
https://xyzcompany.supabase.co/auth/v1/callback
```

---

## Step B — Create a Google OAuth client (Google Cloud)

Students will click **Continue with Google**. Google must trust your Supabase project.

### B1. Open Google Cloud Console

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Sign in with a Google account you control (can be the same as `projectsteamcollective@gmail.com`, or your own)
3. Top bar → click the project dropdown → **New Project**
   - Name: `Project STEAM Auth` (any name)
   - Click **Create**
4. Make sure that new project is selected in the top bar

### B2. Configure the OAuth consent screen

1. Left menu → **APIs & Services** → **OAuth consent screen**
2. If asked for User Type, choose **External** → **Create**
3. Fill:
   - **App name:** `Project STEAM`
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue**
5. **Scopes** → leave defaults → **Save and Continue**
6. **Test users** (important while app is in Testing mode):
   - Click **Add users**
   - Add the Gmail addresses that should be allowed to sign in during testing  
     (your email, your daughter’s email, a couple of student test accounts)
   - **Save and Continue**
7. Finish back to dashboard

> Later, when ready for all students worldwide, you can click **Publish app** on the consent screen so any Google account can sign in (Google may ask for verification if you request sensitive scopes; basic sign-in usually works after publish for many student apps).

### B3. Create OAuth Client ID

1. Left menu → **APIs & Services** → **Credentials**
2. Click **+ Create credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Project STEAM Supabase`
5. Under **Authorized JavaScript origins**, click **Add URI** and add:
   ```text
   https://YOUR_PROJECT_REF.supabase.co
   ```
   (same host as your Supabase Project URL — no path)
6. Under **Authorized redirect URIs**, click **Add URI** and add **exactly**:
   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   ⚠️ This must be the **Supabase** callback, not the Vercel `/auth/callback` URL.
7. Click **Create**
8. Copy:
   - **Client ID**
   - **Client secret**

Keep this window open.

---

## Step C — Enable Google provider in Supabase

1. Supabase dashboard → your project
2. Left menu → **Authentication**
3. Click **Providers** (or **Sign In / Providers**)
4. Open **Google**
5. Turn **Enable Sign in with Google** ON
6. Paste:
   - **Client ID** from Google Cloud
   - **Client Secret** from Google Cloud
7. Click **Save**

(Optional) You can also enable **GitHub** later the same way. Google alone is enough for Indian students.

---

## Step D — Supabase Site URL + Redirect allow list

This tells Supabase where to send students **after** Google login (your Next.js app).

1. Supabase → **Authentication** → **URL Configuration**  
   (sometimes under Authentication → Settings)
2. Set **Site URL** to your live site, for example:
   ```text
   https://projectstream.vercel.app
   ```
   (or `https://projectsteam.vercel.app` if that is your primary domain)
3. Under **Redirect URLs**, add each of these on its own line / entry:
   ```text
   https://projectstream.vercel.app/auth/callback
   ```
   If you also use another Vercel domain:
   ```text
   https://projectsteam.vercel.app/auth/callback
   ```
   For local testing later:
   ```text
   http://localhost:3000/auth/callback
   ```
4. **Save**

### Two different callback URLs (easy to mix up)

| URL | Where you add it | Purpose |
|-----|------------------|---------|
| `https://xxxx.supabase.co/auth/v1/callback` | Google Cloud → Authorized redirect URIs | Google → Supabase |
| `https://your-site.vercel.app/auth/callback` | Supabase → Redirect URLs | Supabase → your website |

Both are required.

---

## Step E — Vercel environment variables + Redeploy

1. Open [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Open your **projectsteam** / **projectstream** project
3. **Settings** → **Environment Variables**
4. Add these (Production at minimum; also Preview if you want):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Step A |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key from Step A |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key from Step A |
| `ADMIN_PASSWORD` | a strong password for `/admin` |
| `INGEST_SECRET` | output of `openssl rand -hex 32` (same value you will put in Apps Script) |
| `GROQ_API_KEY` | from [console.groq.com](https://console.groq.com) (recommended) |
| `NEXT_PUBLIC_SITE_URL` | `https://projectstream.vercel.app` (or your real domain) |

5. After saving, go to **Deployments**
6. Open the latest deployment → **⋯** → **Redeploy**  
   (Env vars do **not** apply until you redeploy)

---

## Step F — Test student login on the website

1. Open your live site (e.g. `https://projectstream.vercel.app`)
2. You should see **Sign in** in the header
3. Click **Sign in** → **Continue with Google**
4. Pick a Google account that is in your OAuth **Test users** list (while app is in Testing)
5. After success you should land back on the site, signed in
6. Open any article → you should see full notes / download unlock

### If login fails

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Google Cloud redirect URI must be exactly `https://YOUR_REF.supabase.co/auth/v1/callback` |
| Stuck / “error=auth” | Add `https://your-site.vercel.app/auth/callback` in Supabase Redirect URLs; redeploy |
| “Access blocked: app is in testing” | Add that Google account under OAuth consent screen → Test users |
| Sign in button does nothing useful | Check Vercel has `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` and you redeployed |

---

## Step G — Re-paste Gmail Apps Script (PDF upload to private storage)

Do this on **projectsteamcollective@gmail.com**.

1. Open [https://script.google.com](https://script.google.com)
2. Open your existing Project STEAM script (or create a new project)
3. Delete all old code in `Code.gs`
4. Open the latest file from GitHub:  
   [gmail/ProjectSteamIngest.gs](https://github.com/vneogi/projectstream/blob/main/gmail/ProjectSteamIngest.gs)  
   → copy everything → paste into the Apps Script editor
5. **Services** (`+`) → enable **Drive API** if not already enabled
6. **Project Settings** (gear) → **Script properties** — confirm:

| Property | Value |
|----------|--------|
| `WEBHOOK_URL` | `https://projectstream.vercel.app/api/ingest/email` |
| `INGEST_SECRET` | **same** string as Vercel `INGEST_SECRET` |

7. Run `setupLabels` once (approve permissions)
8. Run `testWebhookOnly` once → check `/admin` for a new draft
9. Ensure a time trigger exists on `processInbox` (every 5–10 minutes)

After this, when a student emails a PDF/PPTX:

1. Text is extracted → draft created  
2. Original file is uploaded into private `materials` storage (if ≤ ~3.5MB)  
3. You publish in `/admin`  
4. Other students must **Sign in** to download  

---

## Quick checklist (remaining)

- [ ] Google Cloud project + OAuth consent screen + test users
- [ ] OAuth Web client with Supabase redirect URI
- [ ] Supabase Auth → Google enabled with Client ID/Secret
- [ ] Supabase Site URL + `/auth/callback` redirect URLs
- [ ] Vercel env vars + **Redeploy**
- [ ] Test Sign in with Google on the live site
- [ ] Re-paste Apps Script + confirm `INGEST_SECRET` matches
