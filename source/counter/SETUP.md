# Dedicated portfolio visit counter

Use a **new Supabase project for this portfolio**. Nothing here connects to BuildBase.

## Count definition

- Public label: **visits**.
- The first counted homepage load displays **327**, the second **328**, then **329**, and so on.
- 327 is a configured starting number, not verified historical analytics.
- Fresh homepage loads and reloads count. Browser back/forward restoring an existing page does not add a visit. This is not a unique-person or online-user counter.
- The number is stored in PostgreSQL and incremented atomically, so concurrent visits do not overwrite one another.
- Until configured, the hero explicitly says “starting at 327 visits,” rather than pretending a live count exists.

## 1. Create the separate Supabase project

1. Open the [Supabase dashboard](https://supabase.com/dashboard) and create a new project, for example `portfolio-visits`.
2. Select your organization, region, and desired plan. Store the database password privately; I do not need it.
3. Wait until the new project is ready.
4. Copy its **Project URL** from the project's Connect dialog. It looks like `https://<project-ref>.supabase.co`.

## 2. Run the migration

1. Open **SQL Editor → New query** in the new portfolio project.
2. Paste the complete contents of the accompanying `portfolio-visits.sql` file and run it.
3. Its final read-only check should return `visits = 327`. The check does not increment the count.
4. Re-running the migration preserves any accumulated visits.

The table has Row Level Security enabled. Anonymous and authenticated browser roles cannot read or update it, and cannot execute the counter functions. Only the server's elevated role can execute the two narrow functions. No browser Supabase client is needed.

## 3. Create a server secret

Open **Settings → API Keys** in the new Supabase project and create a secret key specifically for the portfolio backend. Use the current `sb_secret_…` key format.

Keep the key out of chat, source control, screenshots, public files, and frontend code. No publishable/anon key is needed for this implementation. [Supabase API-key documentation](https://supabase.com/docs/guides/getting-started/api-keys)

## 4. Configure the existing portfolio Vercel project

Open **your portfolio Vercel project → Settings → Environment Variables** and add:

| Variable | Value | Scope |
|---|---|---|
| `SUPABASE_URL` | The new portfolio project's HTTPS URL | Production |
| `SUPABASE_SECRET_KEY` | The new portfolio project's secret key | Production |
| `VISIT_COUNTER_LABEL_APPROVED` | `true` | Production |

Do not prefix these names with `NEXT_PUBLIC_`, `PUBLIC_`, or `VITE_`. Only `/api/visits` reads the secret.

Keep Preview and Development counting disabled to avoid review reloads inflating the production count. You can set `VISIT_COUNTER_LABEL_APPROVED=false` in those scopes without adding the secret there.

Save the variables, but **do not deploy yet** if you still want to review the site first. Vercel applies new variables on a subsequent deployment. [Vercel environment-variable documentation](https://vercel.com/docs/environment-variables)

## 5. Tell me only these non-secret details

- New Supabase project name and Project URL/project reference.
- Confirmation that the SQL ran and the read-only check returned 327.
- Your existing Vercel portfolio project's name or dashboard URL.
- Confirmation that the three environment variable names above are configured for Production.

Do **not** paste the secret key or database password. If you want a local read-only connection test, put `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in a local `.env.local` file and share only its filesystem path. That file is ignored by Git and Vercel uploads.

## What I will finish after setup

I will verify the read-only RPC connection without spending a visit, validate that anonymous roles remain blocked, and check the function-to-frontend connection. After you approve the site for commit and deployment, I will verify that `/api/visits` reports the real persistent value and that the hero switches from “starting at 327 visits” to “visit #327.” Subsequent real homepage loads will increase it.

The implementation is already prepared in `api/visits.js`, `source/database/visits.sql`, and `assets/js/visit-greeting.js`. No project or environment settings have been changed remotely.
