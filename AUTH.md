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
   - **App name:** `The Steam Collective Project`  
     (this is the friendly name on the Google permission screen. It does **not** hide `….supabase.co` on the first “Sign in to …” page — see **Fixing the supabase.co login text** below.)
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

Leave **GitHub** off. Students in this audience almost all have Google; GitHub is for developers.

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
| “Student login is not configured yet” | See the section below — the deployment was built without the `NEXT_PUBLIC_*` keys |
| `redirect_uri_mismatch` | Google Cloud redirect URI must be exactly `https://YOUR_REF.supabase.co/auth/v1/callback` |
| Stuck / “error=auth” | Add `https://your-site.vercel.app/auth/callback` in Supabase Redirect URLs; redeploy |
| “Access blocked: app is in testing” | Add that Google account under OAuth consent screen → Test users |
| Sign in button does nothing useful | Check Vercel has `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` and you redeployed |

---

## Fixing “Student login is not configured yet”

This means the **browser bundle** was built without `NEXT_PUBLIC_SUPABASE_URL` and/or
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. The login page now names which one is missing.

Why it happens: variables starting with `NEXT_PUBLIC_` are **baked into the JavaScript at build
time**, not read live at runtime. Adding them in Vercel does nothing until you build again.

Check in this order:

1. **Do the variables exist?**  
   Vercel → Settings → Environment Variables. Names must match exactly (no spaces, no typos):
   ```text
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
2. **Is the Production environment ticked?**  
   If only Preview/Development is selected, the live site will not get them.
3. **Which Supabase key is the “anon” key?**  
   In newer Supabase projects, Settings → API shows a **Publishable key** (`sb_publishable_…`);
   older projects show **anon public** (`eyJ…`). Either one is the correct value for
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do **not** use the `service_role` / secret key here.
4. **Redeploy after saving.**  
   Deployments → latest → **⋯** → **Redeploy**. Wait for it to finish, then hard-refresh the page
   (Cmd+Shift+R) so you are not seeing a cached bundle.
5. **Are you testing the right URL?**  
   A preview deployment only has Preview-scoped variables.

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

7. Run `removeLegacyLabels` once (deletes old Ingested / Failed / Skipped labels)
8. Run `testWebhookOnly` once → check `/admin` for a new draft
9. Ensure a time trigger exists on `processInbox` (every 5–10 minutes)

After this, when a student emails a PDF/PPTX:

1. Text is extracted → draft created  
2. Original file is uploaded into private `materials` storage (if ≤ ~3.5MB)  
3. You publish in `/admin`  
4. Other students must **Sign in** to download  

---

## Quick checklist (remaining)

Launch on the current Vercel URL is complete except a **5-minute smoke test** (below), then **steamco.in**.

- [x] Google Cloud project + OAuth consent screen + test users
- [x] OAuth Web client with Supabase redirect URI
- [x] Supabase Auth → Google enabled with Client ID/Secret
- [x] Supabase Site URL + `/auth/callback` redirect URLs (Vercel host)
- [x] Vercel env vars + **Redeploy**
- [x] Test Sign in with Google on the live site
- [x] Re-paste Apps Script + confirm `INGEST_SECRET` matches
- [x] Run likes SQL (`like_count` + `post_likes`)
- [x] RLS on `posts` and `post_likes`
- [x] Rename Google OAuth app to **The Steam Collective Project**
- [x] Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` (`G-VJ57TFG135`) and redeploy
- [ ] Smoke-test Editor login + a student Google login + one like (after signed-cookie deploy)
- [ ] Point **steamco.in** at Vercel (see **Custom domain: steamco.in** below)

---

## Fixing the supabase.co login text

Google’s first screen shows **Sign in to jhtwdlenesiwxmzbbkqd.supabase.co** because that host is the OAuth redirect (Supabase, not your website). Changing the button label in our code cannot hide it.

Do this:

1. Google Cloud → **APIs & Services** → **OAuth consent screen** → App name: **The Steam Collective Project**. The next screen (“Google wants to access…”) will use that name.
2. To replace the `….supabase.co` host itself: Supabase **Custom Domain** (Pro) for Auth, e.g. `auth.steamco.in`, then update Google’s Authorized JavaScript origins and redirect URI to that host. Do this when you move the site to steamco.in.

Yahoo and iCloud are not worth adding now. Yahoo is not a built-in Supabase provider. Apple (iCloud) needs a paid Apple Developer account and extra certificates. Microsoft/Outlook is optional later for school accounts. **Google is the right default for Indian Class 8–12 students.**

---

## Google Analytics (GA4) — detailed setup

**Live (Oct 2026):** Measurement ID `G-VJ57TFG135` is set in Vercel as `NEXT_PUBLIC_GA_MEASUREMENT_ID`. The homepage includes `gtag/js?id=G-VJ57TFG135`. Check **Reports → Realtime** after a visit. Do **not** create a second GA4 property for steamco.in — keep this ID.

You do this once. The Measurement ID (`G-XXXXXXXX`) is what the website needs. Do **not** paste Google’s full tracking snippet into the project — the tag is already in the code.

Use the same Google account you use for this project (for example `projectsteamcollective@gmail.com` or your own).

### A. Create a GA4 property and web stream

1. Open [https://analytics.google.com](https://analytics.google.com) and sign in.
2. If Google asks you to **Start measuring** / create an account:
   - **Account name:** `The Steam Collective` (this is just the billing/org folder in Google).
   - Uncheck any extra Google ads sharing you do not want.
   - Click **Next**.
3. If you already have Analytics, skip to the gear: bottom-left **Admin**.
4. In **Admin**, under **Property**, click **Create property** (or **Create** → **Property**).
5. Fill:
   - **Property name:** `The Steam Collective Project`
   - **Reporting time zone:** `India` (`(GMT+05:30) Kolkata`) so daily reports match school hours
   - **Currency:** `Indian Rupee (INR)` (only used if you ever track money; likes/visits do not)
6. Click **Next**. Industry: **Education** (or Other). Business size: Small. Goals: tick **Examine user behavior** / **Measure conversions** if asked. Click **Create**.
7. Choose a **platform:** click **Web** (globe), not iOS/Android.
8. **Set up a data stream:**
   - **Website URL:** `https://steamco.in`  
     You can type this **now**, even before the domain is connected. It is a label. Tracking still works on `projectstream.vercel.app` as soon as the tag is live.
   - **Stream name:** `Project STEAM website`
   - Leave **Enhanced measurement** ON (scrolls, outbound clicks, site search if GA detects it).
9. Click **Create stream**.
10. The next screen shows **Web stream details**. Copy **Measurement ID**. It looks like:
    ```text
    G-ABC123XYZ
    ```
    Not the “Stream ID” (a long number). Not a Google Tag Manager `GTM-` id.

    If you closed the panel: **Admin** → **Data streams** → click **Project STEAM website** → Measurement ID is at the top right.

You do **not** need to “install the Google tag” in WordPress or paste HTML. Ignore those instructions.

### B. Put the ID in Vercel (required, then redeploy)

`NEXT_PUBLIC_…` values are baked in at **build** time. Saving the variable without a new deploy does nothing. The Analytics code must also be on `main` (ask to push if this change is not deployed yet).

1. Open [https://vercel.com](https://vercel.com) → your **projectsteam** / **projectstream** project.
2. **Settings** → **Environment Variables**.
3. Click **Add New** (or **Add**).
4. **Key:**
   ```text
   NEXT_PUBLIC_GA_MEASUREMENT_ID
   ```
5. **Value:** paste `G-ABC123XYZ` (your real ID, no quotes, no spaces).
6. **Environments:** tick **Production**. Also tick **Preview** if you want analytics on preview deploys (optional; Production is enough).
7. Save.
8. **Deployments** → open the latest Production deployment → **⋯** → **Redeploy**.  
   Confirm it rebuilds (not “use existing build cache” if Vercel offers a cache-only option — you need a fresh build so the ID is inlined).  
   Or push a new commit to `main`.

### C. Check that data is arriving

1. Open the live site in a **new tab** (or incognito). Click Browse, run a Search, open Ask AI if you like.
2. In Analytics: **Reports** → **Realtime** (left sidebar). Within about 30 seconds you should see **1 user** (you).
3. If Realtime stays at 0:
   - The ID is wrong, or you saved it but did not **redeploy**.
   - Ad blockers / Safari “Prevent cross-site tracking” can hide your own visit. Try Chrome incognito with extensions off.
   - View page source on the live site and search for `G-` — the Measurement ID should appear in a small script. If it is missing, the env var was not present at build time.

### D. What you will see after a day or two

| Analytics report | What it means for Project STEAM |
|------------------|----------------------------------|
| **Reports → Realtime** | Who is on the site right now |
| **Reports → Engagement → Pages and screens** | Home, Browse, article URLs, `/search`, `/ask`, `/auth/login` |
| **Reports → Engagement → Events** | Named actions (below) |
| **Reports → User attributes → Country / City** | Where students visit from (India vs elsewhere) |
| **Reports → Tech → Tech details** | Phone vs laptop, browser |

Custom events the site sends (same names in **Events**):

| Event name | When it fires |
|------------|----------------|
| `page_view` | Every page (automatic) |
| `search` | Student submits the search box (`search_term` is stored) |
| `ask_ai` | Student sends an Ask AI question |
| `file_download` | Signed-in student clicks download |
| `article_like` | Student clicks “This helped” |
| `sign_in_click` | Student clicks Continue with Google |

Standard reports can take **24–48 hours** to fill in. Realtime is immediate.

### E. When steamco.in goes live

Keep the **same** Measurement ID. Do not create a second property or you will split history in two.

1. Analytics → **Admin** → **Data streams** → **Project STEAM website**.
2. Click the pencil next to **Website URL** if you originally used the Vercel URL, and set `https://steamco.in`.
3. Optional: **Configure tag settings** → **Show more** → **List unwanted referrals** if payment/auth domains ever pollute reports (usually not needed).

Vercel does not need a new variable when the domain changes — only if you rotate the `G-` ID.

### F. Privacy (short)

- The tag uses `anonymize_ip`.
- We do not send names or emails to Google Analytics.
- Search terms can appear in the `search` event; they are study topics, not personal data.

---

## Helpful votes (likes)

Run in the Supabase SQL editor (safe if you already ran `schema.sql`):

```sql
alter table posts add column if not exists like_count integer not null default 0;

create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
```

Signed-in students can like an article. Search still requires a keyword match, then more-liked articles rank higher among those matches.

---

## Security checklist (you do these in dashboards)

Code now: signed editor cookie, safe login redirects, rate limits, browser security headers, placeholder admin password blocked on Vercel, RLS documented in `schema.sql`.

### 1. Strong `ADMIN_PASSWORD` in Vercel

The live site **will refuse** the default `change-me-before-deploy`. After this deploy you must set a real password and log into `/admin` again (old editor cookies stop working).

1. Open a terminal on your Mac:
   ```bash
   openssl rand -base64 24
   ```
   Copy the output (one line).
2. [vercel.com](https://vercel.com) → Project STEAM → **Settings** → **Environment Variables**.
3. Find `ADMIN_PASSWORD`. If it is missing or is `change-me-before-deploy`, **Edit** (or Add):
   - Key: `ADMIN_PASSWORD`
   - Value: the random string from step 1
   - Environment: **Production** (and Preview if you use it)
4. Save. **Deployments** → **⋯** → **Redeploy** the Production deployment (needed if the variable existed with the old value at last build; password is read at **runtime**, but redeploy is still safest).
5. Open `https://YOUR-SITE/admin/login`, paste the new password, sign in.
6. Store the password in a password manager. Do not put it in GitHub, email, or the public site.

### 2. Confirm `INGEST_SECRET` is random and matches Apps Script

1. If you never generated one:
   ```bash
   openssl rand -hex 32
   ```
2. Vercel → **Environment Variables** → `INGEST_SECRET` = that value, Production.
3. Apps Script → **Project Settings** (gear) → **Script properties** → `INGEST_SECRET` must be **identical**.
4. Redeploy Vercel if you changed the variable.

### 3. Storage bucket is private

1. [supabase.com/dashboard](https://supabase.com/dashboard) → your project → **Storage**.
2. Open bucket **`materials`**.
3. It must **not** be public. If you see Public: ON, turn it **OFF**.
4. **Storage** → **Policies** for `materials`: there should be **no** policy that allows `anon` or `authenticated` to SELECT. Downloads go through the website after Google login.

### 4. Turn off extra Auth sign-up methods

1. Supabase → **Authentication** → **Providers**.
2. **Google** stays **Enabled**.
3. **Email** / **Email OTP**: disable if you are not using email+password (students should only see Google).
4. **GitHub** and others: **Disabled**.

### 5. Publish Google OAuth only when ready, with 2FA on your accounts

1. [console.cloud.google.com](https://console.cloud.google.com) → the OAuth project → **APIs & Services** → **OAuth consent screen**.
2. While testing: **Testing** + test users only.
3. Before every student: **Publish app** (external).
4. Your Google, Vercel, and Supabase logins: turn on **2-Step Verification** (Google Account → Security).

### 6. Who can open the dashboards

1. Vercel → **Settings** → **Team** (or project access): only your account.
2. Supabase → **Project Settings** → **Team**: only your account.
3. Do not invite student Google accounts as **dashboard** users. Students only use **Sign in with Google** on the public site.

### 7. After a suspected leak

If `SUPABASE_SERVICE_ROLE_KEY` or `INGEST_SECRET` was pasted in chat or a screenshot:

1. Supabase → **Project Settings** → **API** → **Reset** service role key (or generate a new secret as the UI allows) → update Vercel `SUPABASE_SERVICE_ROLE_KEY` → redeploy.
2. Generate a new `INGEST_SECRET`, update Vercel + Apps Script.
3. Generate a new `ADMIN_PASSWORD` as in step 1.

---

## What to do first: security smoke test, then steamco.in

Do **not** switch DNS first. Login, downloads, and email ingest all have **hostnames baked in** (Supabase redirect URLs, Google OAuth, Apps Script `WEBHOOK_URL`, `NEXT_PUBLIC_SITE_URL`). If those still say `projectstream.vercel.app` while students open `steamco.in`, Google sign-in and ingest will fail on the new domain while the old URL still works.

**Order:**

1. **10-minute smoke test on the current Vercel site** (security + features).
2. **Then** add steamco.in in Vercel and update every callback in one sitting (checklist below). Keep `projectstream.vercel.app` as a backup until steamco.in login works.

### Smoke test (do this now)

Use [https://projectstream.vercel.app](https://projectstream.vercel.app):

1. `/admin/login` — sign in with the **new** `ADMIN_PASSWORD`. (Old editor cookies were invalidated.)
2. Open a draft → confirm file upload still works.
3. Student **Continue with Google** → download a PDF.
4. Click **This helped** on an article (requires Google sign-in).
5. Analytics → **Realtime** — you should appear after browsing.

If any of those fail, fix them **before** pointing the domain.

### Custom domain: steamco.in

Do these in order. Tick as you go.

**A. Vercel**

1. Project → **Settings** → **Domains** → Add `steamco.in` and `www.steamco.in` if you want www.
2. Vercel shows DNS records (usually A for `@` and CNAME for `www`).

**B. GoDaddy DNS** (domain registrar)

1. GoDaddy → **My Products** → **steamco.in** → **DNS**.
2. Add the records Vercel listed. Remove conflicting A/CNAME records for `@` / `www` that still point at GoDaddy parking or a builder.
3. Wait until Vercel shows the domain **Valid**. TLS is automatic.

**C. Vercel env + redeploy**

1. Set `NEXT_PUBLIC_SITE_URL` = `https://steamco.in` (Production).
2. **Redeploy** Production (needed because `NEXT_PUBLIC_*` is baked at build time).
3. Do **not** change `NEXT_PUBLIC_GA_MEASUREMENT_ID` — keep `G-VJ57TFG135`.

**D. Supabase Auth URLs**

1. **Authentication** → **URL Configuration**.
2. **Site URL:** `https://steamco.in`
3. **Redirect URLs** — add (keep the Vercel ones until you retire that hostname):
   ```text
   https://steamco.in/auth/callback
   https://www.steamco.in/auth/callback
   https://projectstream.vercel.app/auth/callback
   ```

**E. Google Cloud OAuth client** (same client as today)

1. **APIs & Services** → **Credentials** → your Web client.
2. **Authorized JavaScript origins** — keep `https://YOUR_PROJECT.supabase.co`. Add nothing for steamco.in unless you later buy a Supabase custom auth domain.
3. **Authorized redirect URIs** — must stay  
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`  
   Students will still see `….supabase.co` on the first Google screen until a Supabase custom auth domain (paid) is added. The **consent app name** is already The Steam Collective Project.

**F. Apps Script**

1. Script properties → `WEBHOOK_URL` = `https://steamco.in/api/ingest/email`  
   (same `INGEST_SECRET`).
2. Run `testWebhookOnly` or wait for the inbox trigger. Confirm a draft in `/admin`.

**G. Analytics stream label**

Admin → Data streams → Website URL `https://steamco.in`. Same `G-` ID.

**H. Tell people the new URL only after**

- `https://steamco.in` loads
- Google login returns to steamco.in
- A test email still creates a draft



